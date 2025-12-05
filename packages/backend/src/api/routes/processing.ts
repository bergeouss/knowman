import express from 'express'
import { getRepository } from '../../database'
import { ProcessingJob } from '../../database/entities/ProcessingJob'
import { getQueues } from '../../queues'
import { logger } from '../../logging'

const router = express.Router()

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

    res.json({
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

    res.json({
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
      return res.status(404).json({ error: 'Processing job not found' })
    }

    res.json(job)
  } catch (error) {
    next(error)
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
      return res.status(404).json({ error: 'Failed processing job not found' })
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
      return res.status(400).json({ error: `Unknown job type: ${job.type}` })
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

    res.json({
      success: true,
      message: 'Job queued for retry',
      job,
    })
  } catch (error) {
    next(error)
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
      return res.status(404).json({ error: 'Pending processing job not found' })
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

    res.json({
      success: true,
      message: 'Job cancelled',
    })
  } catch (error) {
    next(error)
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

    res.json({
      success: true,
      deleted: result.affected,
      message: `Cleaned up ${result.affected} old jobs`,
    })
  } catch (error) {
    next(error)
  }
})

export { router as processingRouter }