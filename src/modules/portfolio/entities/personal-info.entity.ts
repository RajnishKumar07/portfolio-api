import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';

@Entity('personal_info')
export class PersonalInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  title: string;

  @Column({ default: true })
  isAvailableForWork: boolean;

  @Column({ nullable: true })
  tagline: string;

  @Column('text')
  about: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  githubUrl: string;

  @Column({ nullable: true })
  linkedinUrl: string;

  @Column({ nullable: true })
  resumeUrl: string;

  @OneToOne(() => Portfolio, (portfolio) => portfolio.personalInfo, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  portfolio: Portfolio;
}
