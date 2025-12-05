import { Job } from 'bullmq'
import { logger } from '../logging'
import { getRepository } from '../database'
import { KnowledgeItem } from '../database/entities/KnowledgeItem'
import { ProcessingJob } from '../database/entities/ProcessingJob'

export interface EmbeddingJobData {
  knowledgeItemId: string
  userId: string
  content: string
  title: string
}

export async function processEmbeddingJob(job: Job<EmbeddingJobData>) {
  const { knowledgeItemId, userId, content } = job.data
  const jobId = job.id

  logger.info(`Processing embedding job ${jobId} for item ${knowledgeItemId}`)

  try {
    // Update job status
    const processingJobRepo = getRepository(ProcessingJob)
    const processingJob = await processingJobRepo.findOne({
      where: { id: jobId as string }
    })

    if (processingJob) {
      processingJob.status = 'processing'
      processingJob.startedAt = new Date()
      await processingJobRepo.save(processingJob)
    }

    // Simple embedding placeholder (to be replaced with actual embedding model)
    // For now, generate dummy embeddings
    const text = content.substring(0, 1000) // Limit content for embedding
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2)
    const uniqueWords = [...new Set(words)]

    // Generate deterministic pseudo-embeddings based on word counts
    const embeddingSize = 384 // Common embedding size
    const embeddings = new Array(embeddingSize).fill(0)

    uniqueWords.forEach((word, i) => {
      const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const seed = (hash + i) % embeddingSize
      embeddings[seed] = (embeddings[seed] + 1) / (uniqueWords.length + 1)
    })

    // Update knowledge item
    const knowledgeItemRepo = getRepository(KnowledgeItem)
    const knowledgeItem = await knowledgeItemRepo.findOne({
      where: { id: knowledgeItemId, userId }
    })

    if (!knowledgeItem) {
      throw new Error(`Knowledge item ${knowledgeItemId} not found`)
    }

    knowledgeItem.embeddings = embeddings
    knowledgeItem.processedDate = new Date()
    if (knowledgeItem.status === 'captured') {
      knowledgeItem.status = 'processed'
    }
    await knowledgeItemRepo.save(knowledgeItem)

    // Update processing job
    if (processingJob) {
      processingJob.status = 'completed'
      processingJob.completedAt = new Date()
      processingJob.output = { embeddingSize: embeddingSize }
      await processingJobRepo.save(processingJob)
    }

    logger.info(`Embedding job ${jobId} completed`)
    return { embeddingSize: embeddingSize }
  } catch (error) {
    logger.error(error, `Embedding job ${jobId} failed`)

    // Update processing job with error
    const processingJobRepo = getRepository(ProcessingJob)
    const processingJob = await processingJobRepo.findOne({
      where: { id: jobId as string }
    })

    if (processingJob) {
      processingJob.status = 'failed'
      processingJob.error = error instanceof Error ? error.message : String(error)
      processingJob.completedAt = new Date()
      await processingJobRepo.save(processingJob)
    }

    throw error
  }
}