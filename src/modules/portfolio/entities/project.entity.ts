import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';

/**
 * Represents a single Project showcase inside a Portfolio.
 * Uses flexible `json` columns for dynamic list attributes like `features` and `techStack`
 * to minimize unnecessary DB join tables for tiny string arrays.
 */
@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  period: string;

  @Column({ nullable: true })
  role: string;

  @Column({ nullable: true })
  link: string;

  @Column({ nullable: true })
  imagePath: string;

  @Column('json', { nullable: true })
  features: string[];

  @Column('json', { nullable: true })
  techStack: string[];

  @Column('json', { nullable: true })
  links: { label: string; url: string }[];

  @Column('simple-array')
  tags: string[];

  @Column({ default: 0 })
  displayOrder: number;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.projects, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  portfolio: Portfolio;
}
