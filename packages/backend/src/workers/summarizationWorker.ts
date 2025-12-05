import { Job } from 'bullmq'
import { logger } from '../logging'
import { getRepository } from '../database'
import { KnowledgeItem } from '../database/entities/KnowledgeItem'
import { ProcessingJob } from '../database/entities/ProcessingJob'

export interface SummarizationJobData {
  knowledgeItemId: string
  userId: string
  content: string
  title: string
  language?: string
}

export async function processSummarizationJob(job: Job<SummarizationJobData>) {
  const { knowledgeItemId, userId, content, title } = job.data
  const jobId = job.id

  logger.info(`Processing summarization job ${jobId} for item ${knowledgeItemId}`)

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

    // Simple summarization logic (to be replaced with actual LLM)
    // For now, just take first 3 sentences or 500 characters
    const sentences = content.split(/[.!?]+/)
    const summary = sentences.slice(0, 3).join('. ') + '.'
    const truncatedSummary = summary.length > 500 ? summary.substring(0, 497) + '...' : summary

    // Update knowledge item
    const knowledgeItemRepo = getRepository(KnowledgeItem)
    const knowledgeItem = await knowledgeItemRepo.findOne({
      where: { id: knowledgeItemId, userId }
    })

    if (!knowledgeItem) {
      throw new Error(`Knowledge item ${knowledgeItemId} not found`)
    }

    knowledgeItem.summary = truncatedSummary
    knowledgeItem.processedDate = new Date()
    knowledgeItem.status = 'processed'
    await knowledgeItemRepo.save(knowledgeItem)

    // Update processing job
    if (processingJob) {
      processingJob.status = 'completed'
      processingJob.completedAt = new Date()
      processingJob.output = { summary: truncatedSummary }
      await processingJobRepo.save(processingJob)
    }

    logger.info(`Summarization job ${jobId} completed`)
    return { summary: truncatedSummary }
  } catch (error) {
    logger.error(error, `Summarization job ${jobId} failed`)

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