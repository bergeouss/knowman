import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity('knowledge_graph_edges')
@Index(['sourceId', 'targetId'])
@Index(['type', 'weight'])
export class KnowledgeGraphEdge {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  sourceId!: string

  @Column()
  targetId!: string

  @Column()
  type!: string

  @Column('float', { default: 1.0 })
  weight!: number

  @Column('simple-json', { default: '{}' })
  properties!: Record<string, any>

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}