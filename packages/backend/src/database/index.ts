import { DataSource } from 'typeorm'
import { logger } from '../logging'
import { createDataSource } from './data-source'

let dataSource: DataSource | null = null

export async function initializeDatabase(): Promise<DataSource> {
  if (dataSource?.isInitialized) {
    return dataSource
  }

  try {
    dataSource = await createDataSource()
    await dataSource.initialize()

    // Run migrations
    await dataSource.runMigrations()

    logger.info('Database connected and migrations applied')
    return dataSource
  } catch (error) {
    logger.error(error, 'Failed to initialize database')
    throw error
  }
}

export function getDataSource(): DataSource {
  if (!dataSource?.isInitialized) {
    throw new Error('Database not initialized. Call initializeDatabase() first.')
  }
  return dataSource
}

export async function closeDatabase(): Promise<void> {
  if (dataSource?.isInitialized) {
    await dataSource.destroy()
    dataSource = null
    logger.info('Database connection closed')
  }
}

// Export repository getters
export function getRepository<T>(entity: new () => T) {
  const ds = getDataSource()
  return ds.getRepository(entity)
}