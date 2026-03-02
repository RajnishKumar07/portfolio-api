import { Body, Controller, Get, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { createResponse } from '../../common/utils/response.util';
import { HandleJwtService } from '../../shared/services/jwt.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: HandleJwtService,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() user: any) {
    return createResponse(HttpStatus.OK, 'Authenticated user', user);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    await this.authService.register(registerDto);
    return createResponse(HttpStatus.CREATED, 'User registered successfully.');
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.login(loginDto);
    
    // Attach the JWT to the response cookie
    await this.jwtService.attachCookiesToResponse(response, {
      userId: user.id,
      email: user.email,
    });

    return createResponse(HttpStatus.OK, 'Login successful', {
      id: user.id,
      email: user.email
    });
  }

  @Get('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.cookie('token', 'logout', {
      httpOnly: true,
      expires: new Date(Date.now()),
    });

    return createResponse(HttpStatus.OK, 'User logged out successfully!');
  }
}
