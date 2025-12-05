import express from 'express'
import { z } from 'zod'
import { getRepository } from '../../database'
import { getQueues } from '../../queues'
import { KnowledgeItem } from '../../database/entities/KnowledgeItem'
import { ProcessingJob } from '../../database/entities/ProcessingJob'
import { logger } from '../../logging'

const router = express.Router()

// Validation schema for capture request
const captureSchema = z.object({
  url: z.string().url().optional(),
  content: z.string().min(1),
  title: z.string().min(1),
  userId: z.string().min(1),
  metadata: z.record(z.any()).optional(),
  html: z.string().optional(), // Raw HTML for extraction
})

// POST /api/capture - Capture new content
router.post('/', async (req, res, next) => {
  try {
    // Validate request
    const validated = captureSchema.parse({
      ...req.body,
      userId: (req as any).userId, // From auth middleware
    })

    const { url, content, title, userId, metadata = {}, html } = validated

    logger.info(`Capturing content: ${title} for user ${userId}`)

    // Create knowledge item
    const knowledgeItemRepo = getRepository(KnowledgeItem)
    const knowledgeItem = knowledgeItemRepo.create({
      userId,
      sourceType: url ? 'webpage' : 'document',
      sourceUrl: url,
      title,
      content: content.substring(0, 10000), // Initial content (will be replaced by extraction if HTML provided)
      metadata,
      rawContent: html,
      status: html ? 'captured' : 'processing',
      importanceScore: 0.5,
      readabilityScore: 0.5,
      tags: [],
    })

    await knowledgeItemRepo.save(knowledgeItem)

    // Create processing jobs
    const processingJobRepo = getRepository(ProcessingJob)
    const queues = getQueues()

    const jobs: ProcessingJob[] = []

    // If HTML provided, create extraction job first
    if (html) {
      const extractionJob = processingJobRepo.create({
        knowledgeItemId: knowledgeItem.id,
        userId,
        type: 'extraction',
        status: 'pending',
        priority: 10,
        input: { html, url, title },
      })
      await processingJobRepo.save(extractionJob)
      jobs.push(extractionJob)

      // Add to extraction queue
      await queues.extraction.add(
        'extraction',
        {
          knowledgeItemId: knowledgeItem.id,
          userId,
          html,
          url: url || '',
          title,
        },
        { jobId: extractionJob.id }
      )
    }

    // Create summarization job (lower priority)
    const summarizationJob = processingJobRepo.create({
      knowledgeItemId: knowledgeItem.id,
      userId,
      type: 'summarization',
      status: 'pending',
      priority: 5,
      input: { content, title },
    })
    await processingJobRepo.save(summarizationJob)
    jobs.push(summarizationJob)

    await queues.summarization.add(
      'summarization',
      {
        knowledgeItemId: knowledgeItem.id,
        userId,
        content,
        title,
      },
      { jobId: summarizationJob.id }
    )

    // Create tagging job
    const taggingJob = processingJobRepo.create({
      knowledgeItemId: knowledgeItem.id,
      userId,
      type: 'tagging',
      status: 'pending',
      priority: 3,
      input: { content, title },
    })
    await processingJobRepo.save(taggingJob)
    jobs.push(taggingJob)

    await queues.tagging.add(
      'tagging',
      {
        knowledgeItemId: knowledgeItem.id,
        userId,
        content,
        title,
      },
      { jobId: taggingJob.id }
    )

    // Create embedding job (lowest priority)
    const embeddingJob = processingJobRepo.create({
      knowledgeItemId: knowledgeItem.id,
      userId,
      type: 'embedding',
      status: 'pending',
      priority: 1,
      input: { content, title },
    })
    await processingJobRepo.save(embeddingJob)
    jobs.push(embeddingJob)

    await queues.embedding.add(
      'embedding',
      {
        knowledgeItemId: knowledgeItem.id,
        userId,
        content,
        title,
      },
      { jobId: embeddingJob.id }
    )

    logger.info(`Created knowledge item ${knowledgeItem.id} with ${jobs.length} processing jobs`)

    res.status(201).json({
      success: true,
      data: {
        knowledgeItem,
        processingJobs: jobs,
      },
      message: 'Content captured and processing started',
    })
  } catch (error) {
    logger.error(error, 'Capture request failed')
    next(error)
  }
})

// GET /api/capture/status/:id - Get capture status
router.get('/status/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId

    const knowledgeItemRepo = getRepository(KnowledgeItem)
    const knowledgeItem = await knowledgeItemRepo.findOne({
      where: { id, userId },
    })

    if (!knowledgeItem) {
      return res.status(404).json({ error: 'Knowledge item not found' })
    }

    const processingJobRepo = getRepository(ProcessingJob)
    const processingJobs = await processingJobRepo.find({
      where: { knowledgeItemId: id, userId },
      order: { createdAt: 'DESC' },
    })

    res.json({
      knowledgeItem,
      processingJobs,
    })
  } catch (error) {
    next(error)
  }
})

export { router as captureRouter }