import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm'

export class CreateInitialSchema1690000000000 implements MigrationInterface {
  name = 'CreateInitialSchema1690000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'preferences',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Knowledge items table
    await queryRunner.createTable(
      new Table({
        name: 'knowledge_items',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'userId',
            type: 'varchar',
          },
          {
            name: 'sourceType',
            type: 'varchar',
          },
          {
            name: 'sourceUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'sourceFile',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'summary',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'text',
            default: "'[]'",
          },
          {
            name: 'metadata',
            type: 'text',
            default: "'{}'",
          },
          {
            name: 'rawContent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'processedContent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'embeddings',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'importanceScore',
            type: 'float',
            default: 0.5,
          },
          {
            name: 'readabilityScore',
            type: 'float',
            default: 0.5,
          },
          {
            name: 'captureDate',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'processedDate',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'lastReviewed',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'reviewCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'nextReviewDate',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'captured'",
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Tags table
    await queryRunner.createTable(
      new Table({
        name: 'tags',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'userId',
            type: 'varchar',
          },
          {
            name: 'color',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'usageCount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Processing jobs table
    await queryRunner.createTable(
      new Table({
        name: 'processing_jobs',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'knowledgeItemId',
            type: 'varchar',
          },
          {
            name: 'userId',
            type: 'varchar',
          },
          {
            name: 'type',
            type: 'varchar',
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'pending'",
          },
          {
            name: 'priority',
            type: 'integer',
            default: 0,
          },
          {
            name: 'attempts',
            type: 'integer',
            default: 0,
          },
          {
            name: 'input',
            type: 'text',
            default: "'{}'",
          },
          {
            name: 'output',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'startedAt',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'datetime',
            isNullable: true,
          },
        ],
      }),
      true
    )

    // Knowledge graph nodes table
    await queryRunner.createTable(
      new Table({
        name: 'knowledge_graph_nodes',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'label',
            type: 'varchar',
          },
          {
            name: 'type',
            type: 'varchar',
          },
          {
            name: 'properties',
            type: 'text',
            default: "'{}'",
          },
          {
            name: 'embeddings',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'importance',
            type: 'float',
            default: 0.5,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Knowledge graph edges table
    await queryRunner.createTable(
      new Table({
        name: 'knowledge_graph_edges',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'sourceId',
            type: 'varchar',
          },
          {
            name: 'targetId',
            type: 'varchar',
          },
          {
            name: 'type',
            type: 'varchar',
          },
          {
            name: 'weight',
            type: 'float',
            default: 1.0,
          },
          {
            name: 'properties',
            type: 'text',
            default: "'{}'",
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    )

    // Knowledge item tags join table
    await queryRunner.createTable(
      new Table({
        name: 'knowledge_item_tags',
        columns: [
          {
            name: 'knowledge_item_id',
            type: 'varchar',
          },
          {
            name: 'tag_id',
            type: 'varchar',
          },
        ],
      }),
      true
    )

    // Create foreign keys
    await queryRunner.createForeignKey(
      'knowledge_items',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    )

    await queryRunner.createForeignKey(
      'tags',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    )

    await queryRunner.createForeignKey(
      'processing_jobs',
      new TableForeignKey({
        columnNames: ['knowledgeItemId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'knowledge_items',
        onDelete: 'CASCADE',
      })
    )

    await queryRunner.createForeignKey(
      'knowledge_item_tags',
      new TableForeignKey({
        columnNames: ['knowledge_item_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'knowledge_items',
        onDelete: 'CASCADE',
      })
    )

    await queryRunner.createForeignKey(
      'knowledge_item_tags',
      new TableForeignKey({
        columnNames: ['tag_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tags',
        onDelete: 'CASCADE',
      })
    )

    // Create indexes
    await queryRunner.createIndex(
      'knowledge_items',
      new TableIndex({
        name: 'IDX_knowledge_items_user_status',
        columnNames: ['userId', 'status'],
      })
    )

    await queryRunner.createIndex(
      'knowledge_items',
      new TableIndex({
        name: 'IDX_knowledge_items_user_capture_date',
        columnNames: ['userId', 'captureDate'],
      })
    )

    await queryRunner.createIndex(
      'knowledge_items',
      new TableIndex({
        name: 'IDX_knowledge_items_user_importance',
        columnNames: ['userId', 'importanceScore'],
      })
    )

    await queryRunner.createIndex(
      'processing_jobs',
      new TableIndex({
        name: 'IDX_processing_jobs_status_priority',
        columnNames: ['status', 'priority'],
      })
    )

    await queryRunner.createIndex(
      'knowledge_graph_nodes',
      new TableIndex({
        name: 'IDX_knowledge_graph_nodes_type_importance',
        columnNames: ['type', 'importance'],
      })
    )

    await queryRunner.createIndex(
      'knowledge_graph_edges',
      new TableIndex({
        name: 'IDX_knowledge_graph_edges_source_target',
        columnNames: ['sourceId', 'targetId'],
      })
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const tables = [
      'knowledge_items',
      'tags',
      'processing_jobs',
      'knowledge_item_tags',
    ]

    for (const table of tables) {
      const tableInstance = await queryRunner.getTable(table)
      if (tableInstance) {
        const foreignKeys = tableInstance.foreignKeys
        for (const foreignKey of foreignKeys) {
          await queryRunner.dropForeignKey(table, foreignKey)
        }
      }
    }

    // Drop tables
    await queryRunner.dropTable('knowledge_item_tags')
    await queryRunner.dropTable('knowledge_graph_edges')
    await queryRunner.dropTable('knowledge_graph_nodes')
    await queryRunner.dropTable('processing_jobs')
    await queryRunner.dropTable('tags')
    await queryRunner.dropTable('knowledge_items')
    await queryRunner.dropTable('users')
  }
}