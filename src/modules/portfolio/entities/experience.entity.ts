import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';

/**
 * Represents a single work experience entry within a Portfolio.
 * Utilizes generic `json` column types for `responsibilities`, `projects`, and `recognition`
 * to allow flexible frontend data structures without requiring rigid separate DB tables for each bullet point.
 */
@Entity('experiences')
export class Experience {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  role: string;

  @Column()
  company: string;

  @Column()
  period: string; // E.g., 'Jan 2020 - Present'

  @Column({ nullable: true })
  location: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('json', { nullable: true })
  responsibilities: string[];

  @Column('json', { nullable: true })
  projects: any[];

  @Column('json', { nullable: true })
  recognition: any;

  @Column({ default: 0 })
  displayOrder: number;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.experiences, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  portfolio: Portfolio;
}
