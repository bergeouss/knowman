import { Job } from 'bullmq'
import { logger } from '../logging'
import { getRepository } from '../database'
import { KnowledgeItem } from '../database/entities/KnowledgeItem'
import { ProcessingJob } from '../database/entities/ProcessingJob'
import { Tag } from '../database/entities/Tag'
import { AIProviderFactory } from '../ai/factory'

export interface TaggingJobData {
  knowledgeItemId: string
  userId: string
  content: string
  title: string
  existingTags?: string[]
}

export async function processTaggingJob(job: Job<TaggingJobData>) {
  const { knowledgeItemId, userId, content, title, existingTags = [] } = job.data
  const jobId = job.id

  logger.info(`Processing tagging job ${jobId} for item ${knowledgeItemId}`)

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

    // Use AI provider for tagging (main provider, not embedding)
    const aiProvider = AIProviderFactory.getInstance(false)

    const taggingResult = await aiProvider.generateTags({
      content,
      title,
      existingTags,
      maxTags: 5
    })

    const allTags = taggingResult.tags

    // Update knowledge item
    const knowledgeItemRepo = getRepository(KnowledgeItem)
    const knowledgeItem = await knowledgeItemRepo.findOne({
      where: { id: knowledgeItemId, userId }
    })

    if (!knowledgeItem) {
      throw new Error(`Knowledge item ${knowledgeItemId} not found`)
    }

    knowledgeItem.tags = allTags
    knowledgeItem.processedDate = new Date()
    if (knowledgeItem.status === 'captured') {
      knowledgeItem.status = 'processed'
    }
    await knowledgeItemRepo.save(knowledgeItem)

    // Update or create tag entities
    const tagRepo = getRepository(Tag)
    for (const tagName of allTags) {
      let tag = await tagRepo.findOne({
        where: { name: tagName, userId }
      })

      if (!tag) {
        tag = tagRepo.create({
          name: tagName,
          userId,
          usageCount: 1
        })
      } else {
        tag.usageCount += 1
      }

      await tagRepo.save(tag)
    }

    // Update processing job
    if (processingJob) {
      processingJob.status = 'completed'
      processingJob.completedAt = new Date()
      processingJob.output = {
        tags: allTags,
        model: taggingResult.model,
        confidence: taggingResult.confidence
      }
      await processingJobRepo.save(processingJob)
    }

    logger.info(`Tagging job ${jobId} completed using ${taggingResult.model}`)
    return {
      tags: allTags,
      model: taggingResult.model,
      confidence: taggingResult.confidence
    }
  } catch (error) {
    logger.error(error, `Tagging job ${jobId} failed`)

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