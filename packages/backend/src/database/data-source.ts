import { DataSource } from 'typeorm'
import { config } from '../config'

// Import entities
import { User } from './entities/User'
import { KnowledgeItem } from './entities/KnowledgeItem'
import { Tag } from './entities/Tag'
import { ProcessingJob } from './entities/ProcessingJob'
import { KnowledgeGraphNode } from './entities/KnowledgeGraphNode'
import { KnowledgeGraphEdge } from './entities/KnowledgeGraphEdge'

// Import migrations
import { CreateInitialSchema1690000000000 } from './migrations/1690000000000-CreateInitialSchema'

export async function createDataSource(): Promise<DataSource> {
  const isTest = config.NODE_ENV === 'test'

  const dataSource = new DataSource({
    type: 'sqlite',
    database: config.DATABASE_URL.replace('sqlite:', ''),
    synchronize: false, // Never use synchronize in production
    logging: config.DATABASE_LOGGING,
    entities: [
      User,
      KnowledgeItem,
      Tag,
      ProcessingJob,
      KnowledgeGraphNode,
      KnowledgeGraphEdge,
    ],
    migrations: [
      CreateInitialSchema1690000000000,
    ],
    migrationsRun: !isTest,
    migrationsTableName: 'migrations',
    subscribers: [],
    extra: {
      // SQLite specific options
      readonly: false,
    },
  })

  return dataSource
}

// Export for migration CLI
export default createDataSource()