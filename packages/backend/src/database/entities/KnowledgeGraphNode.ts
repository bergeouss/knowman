import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity('knowledge_graph_nodes')
@Index(['type', 'importance'])
export class KnowledgeGraphNode {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  label!: string

  @Column({
    type: 'varchar',
    enum: ['concept', 'topic', 'entity', 'document'],
  })
  type!: string

  @Column('simple-json', { default: '{}' })
  properties!: Record<string, any>

  @Column('simple-array', { nullable: true, type: 'text' })
  embeddings?: number[]

  @Column('float', { default: 0.5 })
  importance!: number

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}