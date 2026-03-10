import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';

/**
 * Represents an authenticated user in the system.
 * This entity is responsible for secure credential storage (via `passwordHash`) 
 * and holds a One-to-Many relationship with `Portfolio`, allowing a single 
 * user to own multiple distinct portfolio profiles.
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Portfolio, (portfolio) => portfolio.user)
  portfolios: Portfolio[];
}
