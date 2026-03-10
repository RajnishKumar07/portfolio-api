import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

/**
 * Service for handling identity verifications.
 * Bridges the AuthController endpoints to the `UsersService` for password hashing and DB lookups.
 */
@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(registerDto: RegisterDto) {
    // Delegate the actual hashing and DB insertion to the UsersService
    return this.usersService.createUser(registerDto.email, registerDto.password);
  }

  async login(loginDto: LoginDto) {
    // 1. Verify if the account exists in the database
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid Credentials'); // 401 on not found to prevent user enumeration
    }

    // 2. Validate the provided plaintext password against the stored bcrypt hash
    const isPasswordMatch = await this.usersService.comparePasswords(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    // 3. Return the validated user object (JWT generation is handled downstream in the Controller)
    return user;
  }
}
