import { IsString, IsBoolean, IsOptional, ValidateNested, IsArray, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data Transfer Object for validating Personal Information payloads.
 * Includes optional fields like `resumeUrl` (Cloudinary upload payload) and
 * standard biographic `about` details.
 */
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

  @IsOptional()
  @IsString()
  resumeUrl?: string;
}

/**
 * DTO for validating a single Experience entry.
 * Validates dynamic array-based responsibilities and attached projects.
 */
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

/**
 * DTO for validating Education records.
 */
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

/**
 * DTO for validating Project arrays.
 * Handles nested arrays of string literals for features, tags, and tech stacks.
 */
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

/**
 * DTO for validating Skill Categories (e.g. 'Frontend', 'Backend') and their nested item lists.
 */
export class CreateSkillDto {
  @IsString()
  category: string;

  @IsArray()
  @IsString({ each: true })
  items: string[];
}

/**
 * DTO for external Certification links.
 */
export class CreateCertificationDto {
  @IsString()
  title: string;

  @IsString()
  url: string;
}

/**
 * The Master DTO for creating or updating a complete Portfolio Tree.
 * Leverages `@ValidateNested()` and `class-transformer`'s `@Type()` to recursively
 * validate the massive JSON payload object all the way down to the deepest nested array elements.
 * Critical for preventing malformed data from reaching the TypeORM saving layer.
 */
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
