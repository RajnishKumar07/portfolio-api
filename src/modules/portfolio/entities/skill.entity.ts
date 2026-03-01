import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  category: string; // E.g., 'Frontend', 'Backend'

  @Column('simple-array')
  items: string[];

  @Column({ default: 0 })
  displayOrder: number;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.skills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  portfolio: Portfolio;
}
