import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm'
import { User } from './User'
import { Tag } from './Tag'

@Entity('knowledge_items')
@Index(['userId', 'status'])
@Index(['userId', 'captureDate'])
@Index(['userId', 'importanceScore'])
export class KnowledgeItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  userId!: string

  @ManyToOne(() => User, (user) => user.knowledgeItems)
  user!: User

  @Column({
    type: 'varchar',
    enum: ['webpage', 'pdf', 'document', 'video', 'audio', 'image', 'note'],
  })
  sourceType!: string

  @Column({ nullable: true })
  sourceUrl?: string

  @Column({ nullable: true })
  sourceFile?: string

  @Column()
  title!: string

  @Column('text')
  content!: string

  @Column('text', { nullable: true })
  summary?: string

  @Column('simple-array', { default: '' })
  tags!: string[]

  @Column('simple-json', { default: '{}' })
  metadata!: Record<string, any>

  @Column('text', { nullable: true })
  rawContent?: string

  @Column('text', { nullable: true })
  processedContent?: string

  @Column('simple-json', { nullable: true })
  embeddings?: number[]

  @Column('float', { default: 0.5 })
  importanceScore!: number

  @Column('float', { default: 0.5 })
  readabilityScore!: number

  @CreateDateColumn()
  captureDate!: Date

  @Column({ nullable: true })
  processedDate?: Date

  @Column({ nullable: true })
  lastReviewed?: Date

  @Column({ default: 0 })
  reviewCount!: number

  @Column({ nullable: true })
  nextReviewDate?: Date

  @Column({
    type: 'varchar',
    enum: ['captured', 'processing', 'processed', 'archived', 'deleted'],
    default: 'captured',
  })
  status!: string

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'knowledge_item_tags',
    joinColumn: { name: 'knowledge_item_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tagEntities!: Tag[]
}