import express from 'express'
import { getRepository } from '../../database'
import { KnowledgeItem } from '../../database/entities/KnowledgeItem'
import { sendSuccessResponse, sendErrorResponse } from '../utils/response'

const router: express.Router = express.Router()

// GET /api/items - List knowledge items
router.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).userId
    const {
      limit = 20,
      offset = 0,
      status,
      sourceType,
      tag,
      sortBy = 'captureDate',
      sortOrder = 'desc',
    } = req.query

    const knowledgeItemRepo = getRepository(KnowledgeItem)
    const qb = knowledgeItemRepo
      .createQueryBuilder('item')
      .where('item.userId = :userId', { userId })
      .andWhere('item.status != :deleted', { deleted: 'deleted' })

    // Apply filters
    if (status) {
      qb.andWhere('item.status = :status', { status })
    }

    if (sourceType) {
      qb.andWhere('item.sourceType = :sourceType', { sourceType })
    }

    if (tag) {
      qb.andWhere('item.tags LIKE :tag', { tag: `%"${tag}"%` })
    }

    // Apply sorting
    const orderField = sortBy === 'importance' ? 'importanceScore' : sortBy
    qb.orderBy(`item.${orderField}`, (sortOrder as string).toUpperCase() as 'ASC' | 'DESC')

    // Get total count
    const total = await qb.getCount()

    // Apply pagination
    qb.skip(parseInt(offset as string))
    qb.take(parseInt(limit as string))

    const items = await qb.getMany()

    return sendSuccessResponse(res, {
      items,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: parseInt(offset as string) + parseInt(limit as string) < total,
    })
  } catch (error) {
    return next(error)
  }
})

// GET /api/items/stats - Get item statistics
router.get('/stats', async (req, res, next) => {
  try {
    const userId = (req as any).userId

    const knowledgeItemRepo = getRepository(KnowledgeItem)

    // Get overall statistics
    const total = await knowledgeItemRepo.count({
      where: { userId, status: 'active' }
    })

    const processed = await knowledgeItemRepo.count({
      where: { userId, status: 'processed' }
    })

    const pending = await knowledgeItemRepo.count({
      where: { userId, status: 'pending' }
    })

    const archived = await knowledgeItemRepo.count({
      where: { userId, status: 'archived' }
    })

    // Get statistics by source type
    const sourceTypeStats = await knowledgeItemRepo
      .createQueryBuilder('item')
      .select('item.sourceType, COUNT(*) as count')
      .where('item.userId = :userId', { userId })
      .andWhere('item.status != :deleted', { deleted: 'deleted' })
      .groupBy('item.sourceType')
      .getRawMany()

    const bySourceType = sourceTypeStats.reduce((acc, stat) => {
      acc[stat.sourceType] = parseInt(stat.count)
      return acc
    }, {} as Record<string, number>)

    // Get statistics by status
    const statusStats = await knowledgeItemRepo
      .createQueryBuilder('item')
      .select('item.status, COUNT(*) as count')
      .where('item.userId = :userId', { userId })
      .groupBy('item.status')
      .getRawMany()

    const byStatus = statusStats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count)
      return acc
    }, {} as Record<string, number>)

    return sendSuccessResponse(res, {
      total,
      processed,
      pending,
      archived,
      bySourceType,
      byStatus,
    })
  } catch (error) {
    return next(error)
  }
})

// GET /api/items/:id - Get single knowledge item
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId

    const knowledgeItemRepo = getRepository(KnowledgeItem)
    const item = await knowledgeItemRepo.findOne({
      where: { id, userId },
    })

    if (!item) {
      return sendErrorResponse(res, 'Knowledge item not found', 404)
    }

    return sendSuccessResponse(res, item)
  } catch (error) {
    return next(error)
  }
})

// PUT /api/items/:id - Update knowledge item
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId
    const { title, tags, status, importanceScore, summary } = req.body

    const knowledgeItemRepo = getRepository(KnowledgeItem)
    const item = await knowledgeItemRepo.findOne({
      where: { id, userId },
    })

    if (!item) {
      return sendErrorResponse(res, 'Knowledge item not found', 404)
    }

    // Update fields
    if (title !== undefined) item.title = title
    if (tags !== undefined) item.tags = tags
    if (status !== undefined) item.status = status
    if (importanceScore !== undefined) item.importanceScore = importanceScore
    if (summary !== undefined) item.summary = summary

    item.updatedAt = new Date()

    await knowledgeItemRepo.save(item)

    return sendSuccessResponse(res, item)
  } catch (error) {
    return next(error)
  }
})

// DELETE /api/items/:id - Delete knowledge item (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId

    const knowledgeItemRepo = getRepository(KnowledgeItem)
    const item = await knowledgeItemRepo.findOne({
      where: { id, userId },
    })

    if (!item) {
      return sendErrorResponse(res, 'Knowledge item not found', 404)
    }

    // Soft delete by updating status
    item.status = 'deleted'
    item.updatedAt = new Date()

    await knowledgeItemRepo.save(item)

    return sendSuccessResponse(res, { success: true, message: 'Knowledge item deleted' })
  } catch (error) {
    return next(error)
  }
})

// POST /api/items/:id/review - Mark item as reviewed
router.post('/:id/review', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId
    const { rating, notes } = req.body

    const knowledgeItemRepo = getRepository(KnowledgeItem)
    const item = await knowledgeItemRepo.findOne({
      where: { id, userId },
    })

    if (!item) {
      return sendErrorResponse(res, 'Knowledge item not found', 404)
    }

    // Update review information
    item.lastReviewed = new Date()
    item.reviewCount += 1

    // Simple spaced repetition algorithm (simplified)
    const daysToAdd = Math.pow(2, Math.min(item.reviewCount, 6)) // 2, 4, 8, 16, 32, 64 days
    item.nextReviewDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000)

    // Update importance based on rating
    if (rating !== undefined) {
      const ratingWeight = 0.3
      item.importanceScore = item.importanceScore * (1 - ratingWeight) + (rating / 5) * ratingWeight
    }

    // Add notes to metadata
    if (notes) {
      item.metadata = {
        ...item.metadata,
        reviewNotes: notes,
        lastReviewRating: rating,
      }
    }

    await knowledgeItemRepo.save(item)

    return sendSuccessResponse(res, {
      success: true,
      nextReviewDate: item.nextReviewDate,
      reviewCount: item.reviewCount,
    })
  } catch (error) {
    return next(error)
  }
})

export { router as itemsRouter }