import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity('processing_jobs')
@Index(['status', 'priority'])
@Index(['knowledgeItemId', 'type'])
export class ProcessingJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  knowledgeItemId!: string

  @Column()
  userId!: string

  @Column({ type: 'enum', enum: ['summarization', 'embedding', 'tagging', 'extraction'] })
  type!: 'summarization' | 'embedding' | 'tagging' | 'extraction'

  @Column({ type: 'enum', enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' })
  status!: 'pending' | 'processing' | 'completed' | 'failed'

  @Column({ default: 0 })
  priority!: number

  @Column({ default: 0 })
  attempts!: number

  @Column('simple-json', { default: '{}' })
  input!: Record<string, any>

  @Column('simple-json', { nullable: true })
  output?: Record<string, any>

  @Column({ nullable: true })
  error?: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @Column({ nullable: true })
  startedAt?: Date

  @Column({ nullable: true })
  completedAt?: Date
}