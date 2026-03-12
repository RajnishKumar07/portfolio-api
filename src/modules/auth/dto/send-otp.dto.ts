import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { OtpType } from '../entities/otp.entity';

export class SendOtpDto {
  @IsEmail({}, { message: 'Must be a valid email address.' })
  @IsNotEmpty()
  email: string;

  @IsEnum(OtpType, { message: 'Type must be REGISTER or RESET_PASSWORD' })
  @IsNotEmpty()
  type: OtpType;
}
