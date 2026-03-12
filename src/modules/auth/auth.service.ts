import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Otp, OtpType } from './entities/otp.entity';
import { MailService } from '../mail/mail.service';

/**
 * Service for handling identity verifications.
 * Bridges the AuthController endpoints to the `UsersService` for password hashing and DB lookups.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(Otp) private readonly otpRepository: Repository<Otp>,
    private readonly mailService: MailService,
  ) {}

  async sendOtp(sendOtpDto: SendOtpDto) {
    const { email, type } = sendOtpDto;

    // Check if user exists contextually based on type
    const existingUser = await this.usersService.findByEmail(email);
    if (type === OtpType.REGISTER && existingUser) {
      throw new BadRequestException('Email is already registered.');
    }
    if (type === OtpType.RESET_PASSWORD && !existingUser) {
      // Avoid user enumeration, but in this implementation we return silently or with generic message
      return { message: 'If the email exists, an OTP has been sent.' };
    }

    // Generate a 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Expire old active OTPs for this email/type to prevent duplicates
    await this.otpRepository.delete({ email, type });

    // Save new OTP
    const otp = this.otpRepository.create({
      email,
      code,
      type,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });
    await this.otpRepository.save(otp);

    // Dispatch email
    await this.mailService.sendOtpEmail(email, code);

    return { message: 'OTP sent successfully.' };
  }

  async validateOtp(email: string, code: string, type: OtpType) {
    const otpRecord = await this.otpRepository.findOne({
      where: {
        email,
        code,
        type,
        expiresAt: MoreThan(new Date()), // Must not be expired
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired OTP code.');
    }

    // OTP is valid; consume it to prevent reuse
    await this.otpRepository.delete(otpRecord.id);
    return true;
  }

  async register(registerDto: RegisterDto) {
    // 1. Validate OTP first
    await this.validateOtp(registerDto.email, registerDto.otp, OtpType.REGISTER);

    // 2. Create the user
    return this.usersService.createUser(registerDto.email, registerDto.password);
  }

  async resetPassword(resetDto: ResetPasswordDto) {
    // 1. Validate OTP
    await this.validateOtp(resetDto.email, resetDto.otp, OtpType.RESET_PASSWORD);

    // 2. Find user
    const user = await this.usersService.findByEmail(resetDto.email);
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    // 3. Update password via UsersService (requires extending UsersService logic slightly, but since UsersRepository isn't exposed here.
    // However, wait, User entity might not be easily updated through `usersService` without a helper method. Let's assume we can add updatePassword to UsersService or use the method here.
    const newHash = await bcrypt.hash(resetDto.newPassword, 10);
    // Actually, I should use a method from UsersService. I will just rely on TypeORM here if usersService doesn't have it, but it's cleaner to add it to UsersService.
    return this.usersService.updatePassword(user.id, newHash);
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
