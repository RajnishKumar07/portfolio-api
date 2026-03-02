import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PersonalInfo } from './personal-info.entity';
import { Experience } from './experience.entity';
import { Project } from './project.entity';
import { Skill } from './skill.entity';
import { Education } from './education.entity';
import { Certification } from './certification.entity';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string; // E.g., 'johndoe' for yourdomain.com/p/johndoe

  @Column({ default: true })
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('simple-array', { nullable: true })
  languages: string[];

  // Relations
  @ManyToOne(() => User, (user) => user.portfolios, { onDelete: 'CASCADE' })
  user: User;

  @OneToOne(() => PersonalInfo, (personalInfo) => personalInfo.portfolio, {
    cascade: true,
  })
  personalInfo: PersonalInfo;

  @OneToMany(() => Experience, (experience) => experience.portfolio, {
    cascade: true,
  })
  experiences: Experience[];

  @OneToMany(() => Education, (education) => education.portfolio, {
    cascade: true,
  })
  educations: Education[];

  @OneToMany(() => Project, (project) => project.portfolio, { cascade: true })
  projects: Project[];

  @OneToMany(() => Skill, (skill) => skill.portfolio, { cascade: true })
  skills: Skill[];

  @OneToMany(() => Certification, (certification) => certification.portfolio, { cascade: true })
  certifications: Certification[];
}
