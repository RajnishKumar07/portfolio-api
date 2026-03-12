import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

/**
 * Service handling direct User table operations.
 * Implements strict `bcryptjs` password hashing and collision checks.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(email: string, passwordPlain: string): Promise<User> {
    // 1. Ensure absolute uniqueness of the email address prior to DB insertion
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new BadRequestException('Email already exists.'); // Throw standard 400 Bad Request
    }

    // 2. Generate a secure cryptographic salt (work factor of 10 is standard balance of security/speed)
    const salt = await bcrypt.genSalt(10);
    // 3. Hash the plaintext password strictly with the generated salt
    const passwordHash = await bcrypt.hash(passwordPlain, salt);

    // 4. Construct the entity instance and execute the DB write operation
    const user = this.userRepository.create({
      email,
      passwordHash,
    });
    return await this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async comparePasswords(plain: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plain, hash);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found.');
    user.passwordHash = passwordHash;
    return await this.userRepository.save(user);
  }
}
