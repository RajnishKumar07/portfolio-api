import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ContactFormDto {
  @IsEmail({}, { message: 'Must be a valid email address.' })
  @IsNotEmpty()
  visitorEmail: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'Message is too long. Max 1000 characters.' })
  message: string;
}
