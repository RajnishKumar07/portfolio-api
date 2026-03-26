import { Body, Controller, Get, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { HandleJwtService } from '../../shared/services/jwt.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/utils/response.util';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

/**
 * REST Controller managing user authentication.
 * Handles Login, Registration, and securely attaching/detaching HTTP-only JWT cookies to the response.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: HandleJwtService,
  ) {}

  /**
   * Retrieves the currently authenticated user's session data.
   * Protected by AuthGuard.
   */
  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() user: JwtPayload) {
    return createResponse(HttpStatus.OK, 'Authenticated user', user);
  }

  /**
   * Registers a new user account into the system.
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    await this.authService.register(registerDto);
    return createResponse(HttpStatus.CREATED, 'User registered successfully.');
  }

  /**
   * Sends an OTP code to the provided email.
   */
  @Post('send-otp')
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    const result = await this.authService.sendOtp(sendOtpDto);
    return createResponse(HttpStatus.OK, result.message);
  }

  /**
   * Resets the user's password using a valid OTP code.
   */
  @Post('reset-password')
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetDto);
    return createResponse(HttpStatus.OK, 'Password reset successfully.');
  }

  /**
   * Authenticates a user and issues a secure HTTP-Only JWT Cookie.
   * Modifies the `express` Response directly to inject the securely signed cookie.
   */
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.login(loginDto);
    
    // 1. Instruct the shared JWT service to generate a signed token and 
    // strictly append it as an `HttpOnly` cookie directly onto the Express response object.
    // This prevents XSS attacks from reading the token via JavaScript.
    await this.jwtService.attachCookiesToResponse(response, {
      userId: user.id,
      email: user.email,
    });

    // 2. Return a pristine JSON payload without the token (as the browser handles the cookie automatically)
    return createResponse(HttpStatus.OK, 'Login successful', {
      userId: user.id,
      email: user.email
    });
  }

  /**
   * Logs out the user by clearing the HTTP-only JWT token cookie from the browser.
   */
  @Get('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    // Overwrite the existing secure cookie with a dummy value ('logout')
    // and force it to expire immediately (Date.now())
    response.cookie('token', 'logout', {
      httpOnly: true,
      expires: new Date(Date.now()),
    });

    return createResponse(HttpStatus.OK, 'User logged out successfully!');
  }
}
