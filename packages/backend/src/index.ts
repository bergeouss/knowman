import 'reflect-metadata'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config'
import { logger } from './logging'
import { initializeDatabase } from './database'
import { initializeRedis } from './redis'
import { initializeQueues, initializeWorkers } from './queues'
import { apiRouter } from './api'

async function bootstrap() {
  // Initialize core services
  logger.info('Starting KnowMan backend service...')
  logger.info(`Environment: ${config.NODE_ENV}`)
  logger.info(`Port: ${config.PORT}`)

  // Initialize database
  await initializeDatabase()
  logger.info('Database initialized')

  // Initialize Redis
  const redis = await initializeRedis()
  logger.info('Redis initialized')

  // Initialize queues
  const queues = await initializeQueues(redis)
  logger.info('Queues initialized')

  // Initialize workers
  await initializeWorkers(redis)
  logger.info('Workers initialized')

  // Create Express app
  const app = express()

  // Middleware
  app.use(helmet())
  app.use(cors({
    origin: config.CORS_ORIGINS,
    credentials: true,
  }))
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'knowman-backend',
      version: config.VERSION,
    })
  })

  // API routes
  app.use('/api', apiRouter)

  // Error handling middleware
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error(err, 'Unhandled error')
    res.status(500).json({
      error: 'Internal server error',
      message: config.NODE_ENV === 'development' ? err.message : undefined,
    })
  })

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  // Start server
  const server = app.listen(config.PORT, () => {
    logger.info(`Server listening on port ${config.PORT}`)
    logger.info(`Health check: http://localhost:${config.PORT}/health`)
    logger.info(`API docs: http://localhost:${config.PORT}/api/docs`)
  })

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Received shutdown signal, shutting down gracefully...')

    // Close server
    server.close(async () => {
      logger.info('HTTP server closed')

      // Close queues
      if (queues) {
        await Promise.all(Object.values(queues).map(queue => queue.close()))
        logger.info('Queues closed')
      }

      // Close Redis
      if (redis) {
        await redis.quit()
        logger.info('Redis connection closed')
      }

      logger.info('Shutdown complete')
      process.exit(0)
    })

    // Force shutdown after timeout
    setTimeout(() => {
      logger.error('Force shutdown after timeout')
      process.exit(1)
    }, 10000)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  return { app, server, redis, queues }
}

// Start the application
bootstrap().catch((error) => {
  logger.fatal(error, 'Failed to start application')
  process.exit(1)
})