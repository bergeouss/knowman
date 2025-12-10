import { Job } from 'bullmq'
import { logger } from '../logging'
import { getRepository } from '../database'
import { KnowledgeItem } from '../database/entities/KnowledgeItem'
import { ProcessingJob } from '../database/entities/ProcessingJob'
import { AIProviderFactory } from '../ai/factory'

export interface EmbeddingJobData {
  knowledgeItemId: string
  userId: string
  content: string
  title: string
}

export async function processEmbeddingJob(job: Job<EmbeddingJobData>) {
  const { knowledgeItemId, userId, content, title } = job.data
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

    // Use AI provider for embeddings (embedding-specific provider)
    const aiProvider = AIProviderFactory.getInstance(true)

    const embeddingResult = await aiProvider.generateEmbeddings({
      content,
      title
    })

    const embeddings = embeddingResult.embeddings

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
      processingJob.output = {
        embeddingSize: embeddings.length,
        model: embeddingResult.model
      }
      await processingJobRepo.save(processingJob)
    }

    logger.info(`Embedding job ${jobId} completed using ${embeddingResult.model}`)
    return {
      embeddingSize: embeddings.length,
      model: embeddingResult.model
    }
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