import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { KnowledgeItem } from './KnowledgeItem'
import { Tag } from './Tag'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true, nullable: true })
  email?: string

  @Column({ nullable: true })
  name?: string

  @Column('simple-json', { nullable: true })
  preferences?: {
    autoCapture: boolean
    theme: 'light' | 'dark' | 'system'
    language: string
    notificationSettings: {
      email: boolean
      push: boolean
      digestFrequency: 'daily' | 'weekly' | 'monthly' | 'never'
    }
  }

  @OneToMany(() => KnowledgeItem, (item) => item.user)
  knowledgeItems!: KnowledgeItem[]

  @OneToMany(() => Tag, (tag) => tag.user)
  tags!: Tag[]

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}