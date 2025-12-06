import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity('knowledge_graph_nodes')
@Index(['type', 'importance'])
export class KnowledgeGraphNode {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  label!: string

  @Column({ type: 'enum', enum: ['concept', 'topic', 'entity', 'document'] })
  type!: 'concept' | 'topic' | 'entity' | 'document'

  @Column('simple-json', { default: '{}' })
  properties!: Record<string, any>

  @Column('simple-json', { nullable: true })
  embeddings?: number[]

  @Column({ type: 'float', default: 0.5 })
  importance!: number

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}