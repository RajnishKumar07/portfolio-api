import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for User Authentication (Login).
 * Enforces email structure and password presence before hitting the AuthController.
 */
export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email.' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
