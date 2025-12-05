import express from 'express'
import { getRepository } from '../../database'
import { KnowledgeItem } from '../../database/entities/KnowledgeItem'

const router = express.Router()

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

    res.json({
      items,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: parseInt(offset as string) + parseInt(limit as string) < total,
    })
  } catch (error) {
    next(error)
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
      return res.status(404).json({ error: 'Knowledge item not found' })
    }

    res.json(item)
  } catch (error) {
    next(error)
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
      return res.status(404).json({ error: 'Knowledge item not found' })
    }

    // Update fields
    if (title !== undefined) item.title = title
    if (tags !== undefined) item.tags = tags
    if (status !== undefined) item.status = status
    if (importanceScore !== undefined) item.importanceScore = importanceScore
    if (summary !== undefined) item.summary = summary

    item.updatedAt = new Date()

    await knowledgeItemRepo.save(item)

    res.json(item)
  } catch (error) {
    next(error)
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
      return res.status(404).json({ error: 'Knowledge item not found' })
    }

    // Soft delete by updating status
    item.status = 'deleted'
    item.updatedAt = new Date()

    await knowledgeItemRepo.save(item)

    res.json({ success: true, message: 'Knowledge item deleted' })
  } catch (error) {
    next(error)
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
      return res.status(404).json({ error: 'Knowledge item not found' })
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

    res.json({
      success: true,
      nextReviewDate: item.nextReviewDate,
      reviewCount: item.reviewCount,
    })
  } catch (error) {
    next(error)
  }
})

export { router as itemsRouter }