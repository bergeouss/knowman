import { Job } from 'bullmq'
import { logger } from '../logging'
import { getRepository } from '../database'
import { KnowledgeItem } from '../database/entities/KnowledgeItem'
import { ProcessingJob } from '../database/entities/ProcessingJob'
import { Tag } from '../database/entities/Tag'

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

    // Simple tagging logic (to be replaced with actual NLP/ML)
    // Extract potential tags from content and title
    const text = (title + ' ' + content).toLowerCase()
    const words = text.split(/\W+/).filter(w => w.length > 3)

    // Common stop words to ignore
    const stopWords = new Set(['that', 'this', 'with', 'from', 'have', 'what', 'when', 'where', 'which', 'will', 'your', 'they', 'their'])

    // Count word frequencies
    const wordCounts: Record<string, number> = {}
    words.forEach(word => {
      if (!stopWords.has(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1
      }
    })

    // Get top 5 words as tags
    const topWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)

    // Combine with existing tags
    const allTags = [...new Set([...existingTags, ...topWords])]

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
      processingJob.output = { tags: allTags }
      await processingJobRepo.save(processingJob)
    }

    logger.info(`Tagging job ${jobId} completed`)
    return { tags: allTags }
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