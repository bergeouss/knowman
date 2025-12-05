import express from 'express'
import { captureRouter } from './routes/capture'
import { searchRouter } from './routes/search'
import { itemsRouter } from './routes/items'
import { tagsRouter } from './routes/tags'
import { processingRouter } from './routes/processing'
import { authMiddleware } from '../middleware/auth'

export const apiRouter = express.Router()

// Health check (already in main app)
// apiRouter.get('/health', (req, res) => {
//   res.json({ status: 'ok' })
// })

// API documentation
apiRouter.get('/docs', (req, res) => {
  res.json({
    name: 'KnowMan API',
    version: '0.1.0',
    endpoints: {
      '/api/capture': 'Capture new content',
      '/api/search': 'Search knowledge base',
      '/api/items': 'Manage knowledge items',
      '/api/tags': 'Manage tags',
      '/api/processing': 'Processing job management',
    },
    authentication: 'Bearer token or API key',
  })
})

// Apply authentication middleware to all routes (except health/docs)
apiRouter.use(authMiddleware)

// Mount routes
apiRouter.use('/capture', captureRouter)
apiRouter.use('/search', searchRouter)
apiRouter.use('/items', itemsRouter)
apiRouter.use('/tags', tagsRouter)
apiRouter.use('/processing', processingRouter)

// Error handling for API routes
apiRouter.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})