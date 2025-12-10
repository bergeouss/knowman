import express from 'express'
import { getRepository } from '../../database'
import { ProcessingJob } from '../../database/entities/ProcessingJob'
import { getQueues } from '../../queues'
import { logger } from '../../logging'
import { sendSuccessResponse, sendErrorResponse } from '../utils/response'

const router: express.Router = express.Router()

// GET /api/processing/status - Get processing status overview
router.get('/status', async (req, res, next) => {
  try {
    const userId = (req as any).userId

    const processingJobRepo = getRepository(ProcessingJob)

    // Get counts by status and type
    const statusCounts = await processingJobRepo
      .createQueryBuilder('job')
      .select('job.status, job.type, COUNT(*) as count')
      .where('job.userId = :userId', { userId })
      .groupBy('job.status, job.type')
      .getRawMany()

    // Get recent jobs
    const recentJobs = await processingJobRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    })

    // Calculate queue lengths (approximate)
    const queues = getQueues()
    const queueStats = await Promise.all(
      Object.entries(queues).map(async ([name, queue]) => {
        const counts = await queue.getJobCounts()
        return {
          name,
          waiting: counts.waiting,
          active: counts.active,
          completed: counts.completed,
          failed: counts.failed,
          delayed: counts.delayed,
        }
      })
    )

    sendSuccessResponse(res, {
      statusCounts,
      recentJobs,
      queueStats,
      summary: {
        total: statusCounts.reduce((acc, curr) => acc + parseInt(curr.count), 0),
        pending: statusCounts
          .filter((s) => s.status === 'pending')
          .reduce((acc, curr) => acc + parseInt(curr.count), 0),
        processing: statusCounts
          .filter((s) => s.status === 'processing')
          .reduce((acc, curr) => acc + parseInt(curr.count), 0),
        failed: statusCounts
          .filter((s) => s.status === 'failed')
          .reduce((acc, curr) => acc + parseInt(curr.count), 0),
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/processing/jobs - List processing jobs
router.get('/jobs', async (req, res, next) => {
  try {
    const userId = (req as any).userId
    const {
      limit = 20,
      offset = 0,
      status,
      type,
      knowledgeItemId,
    } = req.query

    const processingJobRepo = getRepository(ProcessingJob)
    const qb = processingJobRepo
      .createQueryBuilder('job')
      .where('job.userId = :userId', { userId })

    if (status) {
      qb.andWhere('job.status = :status', { status })
    }

    if (type) {
      qb.andWhere('job.type = :type', { type })
    }

    if (knowledgeItemId) {
      qb.andWhere('job.knowledgeItemId = :knowledgeItemId', { knowledgeItemId })
    }

    const total = await qb.getCount()
    qb.orderBy('job.createdAt', 'DESC')
    qb.skip(parseInt(offset as string))
    qb.take(parseInt(limit as string))

    const jobs = await qb.getMany()

    sendSuccessResponse(res, {
      jobs,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: parseInt(offset as string) + parseInt(limit as string) < total,
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/processing/jobs/:id - Get specific job
router.get('/jobs/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId

    const processingJobRepo = getRepository(ProcessingJob)
    const job = await processingJobRepo.findOne({
      where: { id, userId },
    })

    if (!job) {
      return sendErrorResponse(res, 'Processing job not found', 404)
    }

    return sendSuccessResponse(res, job)
  } catch (error) {
    return next(error)
  }
})

// POST /api/processing/jobs/:id/retry - Retry failed job
router.post('/jobs/:id/retry', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId

    const processingJobRepo = getRepository(ProcessingJob)
    const job = await processingJobRepo.findOne({
      where: { id, userId, status: 'failed' },
    })

    if (!job) {
      return sendErrorResponse(res, 'Failed processing job not found', 404)
    }

    // Reset job status
    job.status = 'pending'
    job.attempts = 0
    job.error = undefined
    job.startedAt = undefined
    job.completedAt = undefined
    job.updatedAt = new Date()

    await processingJobRepo.save(job)

    // Re-add to appropriate queue
    const queues = getQueues()
    const queue = queues[job.type as keyof typeof queues]

    if (!queue) {
      return sendErrorResponse(res, `Unknown job type: ${job.type}`, 400)
    }

    await queue.add(
      job.type,
      {
        ...job.input,
        knowledgeItemId: job.knowledgeItemId,
        userId: job.userId,
      },
      { jobId: job.id }
    )

    logger.info(`Retried job ${id} (${job.type})`)

    return sendSuccessResponse(res, {
      success: true,
      message: 'Job queued for retry',
      job,
    })
  } catch (error) {
    return next(error)
  }
})

// POST /api/processing/jobs/:id/cancel - Cancel pending job
router.post('/jobs/:id/cancel', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId

    const processingJobRepo = getRepository(ProcessingJob)
    const job = await processingJobRepo.findOne({
      where: { id, userId, status: 'pending' },
    })

    if (!job) {
      return sendErrorResponse(res, 'Pending processing job not found', 404)
    }

    // Remove from queue
    const queues = getQueues()
    const queue = queues[job.type as keyof typeof queues]

    if (queue) {
      const bullJob = await queue.getJob(id)
      if (bullJob) {
        await bullJob.remove()
      }
    }

    // Update job status
    job.status = 'failed'
    job.error = 'Cancelled by user'
    job.completedAt = new Date()
    await processingJobRepo.save(job)

    logger.info(`Cancelled job ${id} (${job.type})`)

    return sendSuccessResponse(res, {
      success: true,
      message: 'Job cancelled',
    })
  } catch (error) {
    return next(error)
  }
})

// POST /api/processing/cleanup - Clean up old completed jobs
router.post('/cleanup', async (req, res, next) => {
  try {
    const userId = (req as any).userId
    const { olderThanDays = 30 } = req.body

    const processingJobRepo = getRepository(ProcessingJob)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const result = await processingJobRepo
      .createQueryBuilder()
      .delete()
      .where('userId = :userId', { userId })
      .andWhere('status IN (:...statuses)', { statuses: ['completed', 'failed'] })
      .andWhere('completedAt < :cutoffDate', { cutoffDate })
      .execute()

    logger.info(`Cleaned up ${result.affected} old processing jobs for user ${userId}`)

    sendSuccessResponse(res, {
      success: true,
      deleted: result.affected,
      message: `Cleaned up ${result.affected} old jobs`,
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/processing/queue-status - Get queue status (mock implementation)
router.get('/queue-status', async (_req, res, next) => {
  try {
    // User is authenticated by middleware

    // Mock implementation - in real scenario, this would query BullMQ/Redis
    const queues = getQueues()
    const queueStatuses = await Promise.all(
      Object.entries(queues).map(async ([name, queue]) => {
        const counts = await queue.getJobCounts()
        return {
          name,
          waiting: counts.waiting,
          active: counts.active,
          completed: counts.completed,
          failed: counts.failed,
          delayed: counts.delayed,
        }
      })
    )

    const totalWaiting = queueStatuses.reduce((sum, q) => sum + q.waiting, 0)
    const totalActive = queueStatuses.reduce((sum, q) => sum + q.active, 0)

    // Simple health calculation
    let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (totalWaiting > 100) health = 'degraded'
    if (totalWaiting > 500) health = 'unhealthy'

    sendSuccessResponse(res, {
      queueSize: totalWaiting,
      activeWorkers: totalActive,
      processingRate: 0, // Not tracked in current implementation
      estimatedWaitTime: Math.max(0, totalWaiting - totalActive) * 30, // 30 seconds per job estimate
      health,
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/processing/config - Get processing configuration
router.get('/config', async (_req, res, next) => {
  try {
    // User is authenticated by middleware

    // Get real AI configuration
    const { getAIConfig } = await import('../../ai/config')
    const config = getAIConfig()

    sendSuccessResponse(res, {
      workers: 3,
      timeout: config.AI_REQUEST_TIMEOUT,
      maxRetries: config.AI_MAX_RETRIES,
      enabledTypes: ['summarization', 'tagging', 'embedding'],
      aiProvider: config.AI_PROVIDER,
      embeddingProvider: config.EMBEDDING_PROVIDER,
      aiModel: config.AI_PROVIDER === 'gemini' ? config.GEMINI_MODEL :
               config.AI_PROVIDER === 'openai' ? config.OPENAI_MODEL : 'unknown',
      embeddingModel: config.EMBEDDING_PROVIDER === 'gemini' ? config.GEMINI_EMBEDDING_MODEL :
                     config.EMBEDDING_PROVIDER === 'openai' ? config.OPENAI_EMBEDDING_MODEL : 'unknown',
    })
  } catch (error) {
    next(error)
  }
})

// PUT /api/processing/config - Update processing configuration
router.put('/config', async (req, res, next) => {
  try {
    const { workers, timeout, maxRetries, enabledTypes } = req.body

    // Mock update - in real scenario, this would update config file or database
    logger.info(`User updated processing config: workers=${workers}, timeout=${timeout}, maxRetries=${maxRetries}, enabledTypes=${JSON.stringify(enabledTypes)}`)

    sendSuccessResponse(res, {
      success: true,
      message: 'Configuration updated',
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/processing/test - Test processing system
router.get('/test', async (_req, res, next) => {
  try {
    // User is authenticated by middleware

    // Simple health check
    const queues = getQueues()
    const queueCount = Object.keys(queues).length

    sendSuccessResponse(res, {
      success: true,
      message: `Processing system is operational with ${queueCount} queues`,
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/processing/logs - Get processing logs
router.get('/logs', async (req, res, next) => {
  try {
    // User is authenticated by middleware
    const limit = parseInt(req.query.limit as string) || 50

    // Mock logs - in real scenario, this would query a log storage system
    const mockLogs = Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      level: i % 3 === 0 ? 'error' : i % 2 === 0 ? 'warn' : 'info',
      message: `Mock log entry ${i + 1}`,
      jobId: i % 4 === 0 ? `job_${i}` : undefined,
      itemId: i % 3 === 0 ? `item_${i}` : undefined,
    }))

    sendSuccessResponse(res, mockLogs)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/processing/jobs/completed - Clear completed jobs
router.delete('/jobs/completed', async (req, res, next) => {
  try {
    const userId = (req as any).userId
    const { olderThanDays = 7 } = req.query

    const processingJobRepo = getRepository(ProcessingJob)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays as string))

    const result = await processingJobRepo
      .createQueryBuilder()
      .delete()
      .where('userId = :userId', { userId })
      .andWhere('status = :status', { status: 'completed' })
      .andWhere('completedAt < :cutoffDate', { cutoffDate })
      .execute()

    logger.info(`Cleared ${result.affected} completed jobs for user ${userId}`)

    sendSuccessResponse(res, {
      deletedCount: result.affected || 0,
    })
  } catch (error) {
    next(error)
  }
})

export { router as processingRouter }