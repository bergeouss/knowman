import Redis from 'ioredis'
import { config } from './config'
import { logger } from './logging'

let redis: Redis | null = null

export async function initializeRedis(): Promise<Redis> {
  if (redis?.status === 'ready') {
    return redis
  }

  try {
    // Parse connection URL or use host/port
    let host = 'localhost'
    let port = 6379

    if (config.REDIS_URL && config.REDIS_URL.includes('://')) {
      try {
        const url = new URL(config.REDIS_URL)
        host = url.hostname
        port = parseInt(url.port || '6379')
      } catch (error) {
        logger.warn(error, 'Failed to parse REDIS_URL, using defaults')
      }
    }

    // Build options
    const baseOptions: any = {
      host: config.REDIS_HOST || host,
      port: config.REDIS_PORT || port,
      db: config.REDIS_DB || 0,
      family: config.REDIS_FAMILY || 0, // 0 = IPv4 & IPv6, 4 = IPv4, 6 = IPv6
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000)
        logger.warn(`Redis retry attempt ${times}, delaying ${delay}ms`)
        return delay
      },
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      connectTimeout: 5000,
    }

    // Add password only if it exists
    if (config.REDIS_PASSWORD) {
      baseOptions.password = config.REDIS_PASSWORD
    }

    // Use connection string if provided and no host/port overrides
    if (config.REDIS_URL && !config.REDIS_HOST && !config.REDIS_PORT) {
      redis = new Redis(config.REDIS_URL, baseOptions)
    } else {
      redis = new Redis(baseOptions)
    }

    redis.on('error', (error) => {
      logger.error(error, 'Redis error')
    })

    redis.on('connect', () => {
      logger.info('Redis connected')
    })

    redis.on('ready', () => {
      logger.info('Redis ready')
    })

    redis.on('close', () => {
      logger.warn('Redis connection closed')
    })

    // Test connection
    await redis.ping()

    return redis
  } catch (error) {
    logger.error(error, 'Failed to initialize Redis')
    throw error
  }
}

export function getRedis(): Redis {
  if (!redis || redis.status !== 'ready') {
    throw new Error('Redis not initialized. Call initializeRedis() first.')
  }
  return redis
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
    logger.info('Redis connection closed')
  }
}