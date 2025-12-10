import express from 'express'
import { captureRouter } from './routes/capture'
import { searchRouter } from './routes/search'
import { itemsRouter } from './routes/items'
import { tagsRouter } from './routes/tags'
import { processingRouter } from './routes/processing'
import authRouter from './routes/auth'
import { authMiddleware } from '../middleware/auth'

export const apiRouter: express.Router = express.Router()

// Health check (already in main app)
// apiRouter.get('/health', (req, res) => {
//   res.json({ status: 'ok' })
// })

// API documentation
apiRouter.get('/docs', (_req, res) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  res.json({
    name: 'KnowMan API',
    version: '0.1.0',
    endpoints: {
      '/api/auth': 'Authentication (register, login, refresh, logout)',
      '/api/capture': 'Capture new content',
      '/api/search': 'Search knowledge base',
      '/api/items': 'Manage knowledge items',
      '/api/tags': 'Manage tags',
      '/api/processing': 'Processing job management',
    },
    authentication: 'Bearer token or API key',
  })
})

// Mount auth routes (no authentication required)
apiRouter.use('/auth', authRouter)

// Apply authentication middleware to all other routes
apiRouter.use(authMiddleware)

// Mount protected routes
apiRouter.use('/capture', captureRouter)
apiRouter.use('/search', searchRouter)
apiRouter.use('/items', itemsRouter)
apiRouter.use('/tags', tagsRouter)
apiRouter.use('/processing', processingRouter)

// Error handling for API routes
apiRouter.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  console.error('API Error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})