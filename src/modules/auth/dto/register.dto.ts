import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Data Transfer Object for User Registration.
 * Validates the email format and enforces a minimum password length of 6 characters for security.
 */
export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email.' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  password: string;
}
