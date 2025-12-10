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

  @Column('varchar')
  type!: 'summarization' | 'embedding' | 'tagging' | 'extraction'

  @Column('varchar', { default: 'pending' })
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