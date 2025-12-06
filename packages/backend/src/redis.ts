import Redis from 'ioredis'
import { config } from './config'
import { logger } from './logging'

let redis: Redis | null = null

export async function initializeRedis(): Promise<Redis> {
  if (redis?.status === 'ready') {
    return redis
  }

  try {
    const redisOptions: Record<string, any> = {
      host: config.REDIS_URL.includes('://') ? new URL(config.REDIS_URL).hostname : 'localhost',
      port: config.REDIS_URL.includes('://') ? parseInt(new URL(config.REDIS_URL).port || '6379') : 6379,
      db: config.REDIS_DB,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      maxRetriesPerRequest: 3,
    }

    if (config.REDIS_PASSWORD) {
      redisOptions.password = config.REDIS_PASSWORD
    }

    redis = new Redis(redisOptions)

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