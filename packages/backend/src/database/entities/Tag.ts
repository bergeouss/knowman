import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm'
import { User } from './User'

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  name!: string

  @Column()
  userId!: string

  @ManyToOne(() => User, (user) => user.tags)
  user!: User

  @Column({ nullable: true })
  color?: string

  @Column({ nullable: true })
  description?: string

  @Column({ default: 0 })
  usageCount!: number

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}