import express from 'express'
import { z } from 'zod'
import { getRepository } from '../../database'
import { KnowledgeItem } from '../../database/entities/KnowledgeItem'
import { logger } from '../../logging'

const router: express.Router = express.Router()

// Validation schema for search request
const searchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  tags: z.array(z.string()).optional(),
  sourceTypes: z.array(z.string()).optional(),
  sortBy: z.enum(['relevance', 'date', 'importance']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// POST /api/search - Search knowledge items
router.post('/', async (req, res, next) => {
  try {
    const validated = searchSchema.parse({
      ...req.body,
    })

    const { query, limit, offset, tags, sourceTypes, sortBy, sortOrder } = validated
    const userId = (req as any).userId

    logger.info(`Search request: "${query}" from user ${userId}`)

    const knowledgeItemRepo = getRepository(KnowledgeItem)

    // Build query
    const qb = knowledgeItemRepo
      .createQueryBuilder('item')
      .where('item.userId = :userId', { userId })
      .andWhere('item.status != :deleted', { deleted: 'deleted' })

    // Search in title and content
    if (query) {
      qb.andWhere(
        '(item.title LIKE :query OR item.content LIKE :query OR item.summary LIKE :query)',
        { query: `%${query}%` }
      )
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      // SQLite doesn't support array operations well, so we use JSON array
      // This is a simplified approach - in production use proper tag relationship
      const tagConditions = tags.map((tag, index) => {
        const paramName = `tag${index}`
        qb.setParameter(paramName, `%"${tag}"%`)
        return `item.tags LIKE :${paramName}`
      })
      qb.andWhere(`(${tagConditions.join(' OR ')})`)
    }

    // Filter by source types
    if (sourceTypes && sourceTypes.length > 0) {
      qb.andWhere('item.sourceType IN (:...sourceTypes)', { sourceTypes })
    }

    // Count total
    const total = await qb.getCount()

    // Apply sorting
    switch (sortBy) {
      case 'date':
        qb.orderBy('item.captureDate', sortOrder.toUpperCase() as 'ASC' | 'DESC')
        break
      case 'importance':
        qb.orderBy('item.importanceScore', sortOrder.toUpperCase() as 'ASC' | 'DESC')
        break
      case 'relevance':
      default:
        // Simple relevance: title matches first, then content
        qb.orderBy(
          `CASE WHEN item.title LIKE :query THEN 1 WHEN item.content LIKE :query THEN 2 ELSE 3 END`,
          'ASC'
        )
        qb.addOrderBy('item.captureDate', 'DESC')
        qb.setParameter('query', `%${query}%`)
        break
    }

    // Apply pagination
    qb.skip(offset)
    qb.take(limit)

    // Execute query
    const items = await qb.getMany()

    // Calculate simple relevance scores (placeholder)
    const results = items.map((item) => {
      let relevanceScore = 0.5

      if (query) {
        const queryLower = query.toLowerCase()
        const titleLower = item.title.toLowerCase()
        const contentLower = item.content.toLowerCase()

        if (titleLower.includes(queryLower)) {
          relevanceScore += 0.3
        }
        if (contentLower.includes(queryLower)) {
          relevanceScore += 0.1
        }

        // Count occurrences
        const titleOccurrences = (titleLower.match(new RegExp(queryLower, 'g')) || []).length
        const contentOccurrences = (contentLower.match(new RegExp(queryLower, 'g')) || []).length

        relevanceScore += Math.min(titleOccurrences * 0.05, 0.2)
        relevanceScore += Math.min(contentOccurrences * 0.01, 0.1)
      }

      // Normalize score
      relevanceScore = Math.min(Math.max(relevanceScore, 0), 1)

      return {
        knowledgeItem: item,
        relevanceScore,
        highlights: {
          title: query ? highlightText(item.title, query) : [item.title],
          content: query ? highlightText(item.content.substring(0, 200), query) : [item.content.substring(0, 200)],
        },
      }
    })

    // Sort by relevance score if needed
    if (sortBy === 'relevance') {
      results.sort((a, b) => b.relevanceScore - a.relevanceScore)
    }

    // Get suggested tags (simplified)
    const suggestedTags = await getSuggestedTags(userId, query)

    res.json({
      results,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
      suggestedTags,
      suggestedQueries: getSuggestedQueries(query),
    })
  } catch (error) {
    logger.error(error, 'Search request failed')
    next(error)
  }
})

// Helper function to highlight text
function highlightText(text: string, query: string): string[] {
  const queryLower = query.toLowerCase()
  const textLower = text.toLowerCase()
  const highlights: string[] = []

  let startIndex = 0
  while ((startIndex = textLower.indexOf(queryLower, startIndex)) !== -1) {
    const endIndex = startIndex + query.length
    const before = text.substring(Math.max(0, startIndex - 20), startIndex)
    const match = text.substring(startIndex, endIndex)
    const after = text.substring(endIndex, Math.min(text.length, endIndex + 20))

    highlights.push(`${before}<mark>${match}</mark>${after}`)
    startIndex = endIndex
  }

  // If no matches, return first 100 chars
  if (highlights.length === 0) {
    return [text.substring(0, 100) + (text.length > 100 ? '...' : '')]
  }

  return highlights.slice(0, 3) // Limit to 3 highlights
}

// Helper function to get suggested tags
async function getSuggestedTags(userId: string, query: string): Promise<string[]> {
  try {
    const knowledgeItemRepo = getRepository(KnowledgeItem)
    const items = await knowledgeItemRepo.find({
      where: {
        userId,
        status: 'processed',
      },
      take: 10,
    })

    // Extract tags from items that might be related to query
    const allTags = items.flatMap((item) => item.tags)
    const uniqueTags = [...new Set(allTags)]

    // Filter tags that might be related to query (simplified)
    const queryLower = query.toLowerCase()
    const relatedTags = uniqueTags.filter((tag) =>
      tag.toLowerCase().includes(queryLower) || queryLower.includes(tag.toLowerCase())
    )

    return relatedTags.slice(0, 5)
  } catch (error) {
    logger.error(error, 'Failed to get suggested tags')
    return []
  }
}

// Helper function to get suggested queries
function getSuggestedQueries(query: string): string[] {
  const suggestions = [
    `"${query}"`,
    `${query} tutorial`,
    `how to ${query}`,
    `best practices ${query}`,
    `${query} examples`,
  ]

  return suggestions.slice(0, 3)
}

export { router as searchRouter }