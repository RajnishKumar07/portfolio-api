import { IsString, IsBoolean, IsOptional, ValidateNested, IsArray, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePersonalInfoDto {
  @IsString()
  name: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsBoolean()
  isAvailableForWork?: boolean;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsString()
  about: string;

  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  githubUrl?: string;

  @IsOptional()
  @IsString()
  linkedinUrl?: string;
}

export class CreateExperienceDto {
  @IsString()
  role: string;

  @IsString()
  company: string;

  @IsString()
  period: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  responsibilities?: string[];

  @IsArray()
  @IsOptional()
  projects?: any[];

  @IsOptional()
  recognition?: any;
}

export class CreateEducationDto {
  @IsString()
  degree: string;

  @IsString()
  institution: string;

  @IsString()
  period: string;

  @IsString()
  description: string;
}

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  imagePath?: string;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsArray()
  techStack?: string[];

  @IsOptional()
  @IsArray()
  links?: any[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateSkillDto {
  @IsString()
  category: string;

  @IsArray()
  @IsString({ each: true })
  items: string[];
}

export class CreateCertificationDto {
  @IsString()
  title: string;

  @IsString()
  url: string;
}

export class CreatePortfolioDto {
  @IsString()
  slug: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ValidateNested()
  @Type(() => CreatePersonalInfoDto)
  personalInfo: CreatePersonalInfoDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExperienceDto)
  experiences?: CreateExperienceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEducationDto)
  educations?: CreateEducationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectDto)
  projects?: CreateProjectDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSkillDto)
  skills?: CreateSkillDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCertificationDto)
  certifications?: CreateCertificationDto[];
}
