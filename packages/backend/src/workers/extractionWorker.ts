import { Job } from 'bullmq'
import { Readability } from '@mozilla/readability'
import { JSDOM } from 'jsdom'
import { logger } from '../logging'
import { getRepository } from '../database'
import { KnowledgeItem } from '../database/entities/KnowledgeItem'
import { ProcessingJob } from '../database/entities/ProcessingJob'

export interface ExtractionJobData {
  knowledgeItemId: string
  userId: string
  html: string
  url: string
  title?: string
}

export async function processExtractionJob(job: Job<ExtractionJobData>) {
  const { knowledgeItemId, userId, html, url, title } = job.data
  const jobId = job.id

  logger.info(`Processing extraction job ${jobId} for item ${knowledgeItemId}`)

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

    // Use Readability.js to extract content from HTML
    let extractedContent = ''
    let extractedTitle = title || ''

    if (html) {
      try {
        const dom = new JSDOM(html, {
          url,
          runScripts: 'dangerously',
          resources: 'usable'
        })

        const reader = new Readability(dom.window.document)
        const article = reader.parse()

        if (article) {
          extractedContent = article.textContent || article.content || ''
          extractedTitle = article.title || extractedTitle
        } else {
          // Fallback: extract text from body
          const body = dom.window.document.body
          if (body) {
            extractedContent = body.textContent || ''
          }
        }
      } catch (error) {
        logger.warn(error, `Readability extraction failed for ${url}, using fallback`)
        // Fallback to simple text extraction
        const dom = new JSDOM(html)
        const body = dom.window.document.body
        extractedContent = body?.textContent || ''
      }
    }

    // Clean up content
    extractedContent = extractedContent
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100000) // Limit content size

    // Calculate readability score (simple heuristic)
    const words = extractedContent.split(/\s+/).length
    const sentences = extractedContent.split(/[.!?]+/).length
    const characters = extractedContent.length
    const readabilityScore = sentences > 0 ? (words / sentences) < 30 ? 0.8 : 0.5 : 0.5

    // Update knowledge item
    const knowledgeItemRepo = getRepository(KnowledgeItem)
    const knowledgeItem = await knowledgeItemRepo.findOne({
      where: { id: knowledgeItemId, userId }
    })

    if (!knowledgeItem) {
      throw new Error(`Knowledge item ${knowledgeItemId} not found`)
    }

    knowledgeItem.title = extractedTitle || knowledgeItem.title
    knowledgeItem.content = extractedContent
    knowledgeItem.rawContent = html
    knowledgeItem.readabilityScore = readabilityScore
    knowledgeItem.processedDate = new Date()
    if (knowledgeItem.status === 'captured') {
      knowledgeItem.status = 'processing' // Move to next stage
    }
    await knowledgeItemRepo.save(knowledgeItem)

    // Update processing job
    if (processingJob) {
      processingJob.status = 'completed'
      processingJob.completedAt = new Date()
      processingJob.output = {
        contentLength: extractedContent.length,
        title: extractedTitle,
        readabilityScore
      }
      await processingJobRepo.save(processingJob)
    }

    logger.info(`Extraction job ${jobId} completed`)
    return {
      contentLength: extractedContent.length,
      title: extractedTitle,
      readabilityScore
    }
  } catch (error) {
    logger.error(error, `Extraction job ${jobId} failed`)

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