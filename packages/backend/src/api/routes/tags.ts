import express from 'express'
import { getRepository } from '../../database'
import { Tag } from '../../database/entities/Tag'
import { KnowledgeItem } from '../../database/entities/KnowledgeItem'

const router = express.Router()

// GET /api/tags - List all tags for user
router.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).userId

    const tagRepo = getRepository(Tag)
    const tags = await tagRepo.find({
      where: { userId },
      order: { usageCount: 'DESC', name: 'ASC' },
    })

    res.json(tags)
  } catch (error) {
    next(error)
  }
})

// GET /api/tags/popular - Get popular tags
router.get('/popular', async (req, res, next) => {
  try {
    const userId = (req as any).userId
    const limit = parseInt(req.query.limit as string) || 10

    const tagRepo = getRepository(Tag)
    const tags = await tagRepo.find({
      where: { userId },
      order: { usageCount: 'DESC' },
      take: limit,
    })

    res.json(tags)
  } catch (error) {
    next(error)
  }
})

// GET /api/tags/:name/items - Get items with specific tag
router.get('/:name/items', async (req, res, next) => {
  try {
    const { name } = req.params
    const userId = (req as any).userId
    const limit = parseInt(req.query.limit as string) || 20
    const offset = parseInt(req.query.offset as string) || 0

    const knowledgeItemRepo = getRepository(KnowledgeItem)
    const qb = knowledgeItemRepo
      .createQueryBuilder('item')
      .where('item.userId = :userId', { userId })
      .andWhere('item.status != :deleted', { deleted: 'deleted' })
      .andWhere('item.tags LIKE :tag', { tag: `%"${name}"%` })
      .orderBy('item.captureDate', 'DESC')

    const total = await qb.getCount()
    qb.skip(offset).take(limit)

    const items = await qb.getMany()

    res.json({
      items,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
      tag: name,
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/tags - Create new tag
router.post('/', async (req, res, next) => {
  try {
    const userId = (req as any).userId
    const { name, color, description } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' })
    }

    const tagRepo = getRepository(Tag)

    // Check if tag already exists
    let tag = await tagRepo.findOne({
      where: { name, userId },
    })

    if (tag) {
      return res.status(409).json({ error: 'Tag already exists' })
    }

    // Create new tag
    tag = tagRepo.create({
      name,
      userId,
      color,
      description,
      usageCount: 0,
    })

    await tagRepo.save(tag)

    res.status(201).json(tag)
  } catch (error) {
    next(error)
  }
})

// PUT /api/tags/:id - Update tag
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId
    const { name, color, description } = req.body

    const tagRepo = getRepository(Tag)
    const tag = await tagRepo.findOne({
      where: { id, userId },
    })

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' })
    }

    // Check if new name conflicts with existing tag
    if (name && name !== tag.name) {
      const existingTag = await tagRepo.findOne({
        where: { name, userId },
      })

      if (existingTag) {
        return res.status(409).json({ error: 'Tag name already exists' })
      }

      tag.name = name
    }

    if (color !== undefined) tag.color = color
    if (description !== undefined) tag.description = description

    await tagRepo.save(tag)

    res.json(tag)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/tags/:id - Delete tag
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = (req as any).userId

    const tagRepo = getRepository(Tag)
    const tag = await tagRepo.findOne({
      where: { id, userId },
    })

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' })
    }

    // Remove tag from all knowledge items
    const knowledgeItemRepo = getRepository(KnowledgeItem)
    const itemsWithTag = await knowledgeItemRepo
      .createQueryBuilder('item')
      .where('item.userId = :userId', { userId })
      .andWhere('item.tags LIKE :tag', { tag: `%"${tag.name}"%` })
      .getMany()

    for (const item of itemsWithTag) {
      item.tags = item.tags.filter((t) => t !== tag.name)
      await knowledgeItemRepo.save(item)
    }

    // Delete the tag
    await tagRepo.remove(tag)

    res.json({
      success: true,
      message: `Tag deleted and removed from ${itemsWithTag.length} items`,
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/tags/suggestions/:query - Get tag suggestions
router.get('/suggestions/:query', async (req, res, next) => {
  try {
    const { query } = req.params
    const userId = (req as any).userId

    const tagRepo = getRepository(Tag)
    const tags = await tagRepo
      .createQueryBuilder('tag')
      .where('tag.userId = :userId', { userId })
      .andWhere('tag.name LIKE :query', { query: `%${query}%` })
      .orderBy('tag.usageCount', 'DESC')
      .take(10)
      .getMany()

    res.json(tags.map((tag) => tag.name))
  } catch (error) {
    next(error)
  }
})

export { router as tagsRouter }