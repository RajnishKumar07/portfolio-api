import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { ContactFormDto } from './dto/contact-form.dto';
import { MailService } from '../mail/mail.service';
import { User } from '../users/entities/user.entity';

/**
 * Core business logic service for Portfolios.
 * Handles database transactions using TypeORM repositories for the Portfolio entity.
 */
@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    private readonly mailService: MailService,
  ) {}

  /**
   * Persists a newly created portfolio into the database.
   * Explicitly maps the incoming auth `userId` to the TypeORM relational `user.id`.
   */
  async create(createPortfolioDto: CreatePortfolioDto & { userId?: string }): Promise<Portfolio> {
    const portfolio = this.portfolioRepository.create(createPortfolioDto);
    // Explicitly map the string userId (from our custom auth) into the user relation DB field if needed
    if (createPortfolioDto.userId) {
      portfolio.user = { id: createPortfolioDto.userId } as User;
    }
    return await this.portfolioRepository.save(portfolio);
  }

  /**
   * Fetches all portfolios for a specific user ID.
   * Performs complete eager-loading of all nested child entities (personalInfo, experiences, etc) 
   * so the entire rich object is returned to the frontend dashboard.
   */
  async findAllByUser(userId: string): Promise<Portfolio[]> {
    return this.portfolioRepository.find({
      // 1. Filter the root entities strictly by the requesting user's ID
      where: { user: { id: userId } },
      // 2. Eagerly load the entire nested JSON/relational structure so the frontend gets a complete object in one roundtrip
      relations: ['personalInfo', 'experiences', 'educations', 'projects', 'skills', 'certifications'],
    });
  }

  /**
   * Fetches a single portfolio by its slug.
   * Includes authorization logic: if `isPublic` is false, it throws an UnauthorizedException 
   * unless the `requestingUserId` exactly matches the portfolio owner.
   */
  async findOneBySlug(slug: string, requestingUserId?: string): Promise<Portfolio> {
    // 1. Query the database by the unique string slug and pull down the entire entity tree
    const portfolio = await this.portfolioRepository.findOne({
      where: { slug },
      relations: ['user', 'personalInfo', 'experiences', 'educations', 'projects', 'skills', 'certifications'],
    });

    // 2. Fail fast if the slug doesn't exist to cleanly 404
    if (!portfolio) {
      throw new NotFoundException(`Portfolio with slug ${slug} not found.`);
    }

    // 3. Authorization check: If the portfolio is marked private, ensure the requester is the owner
    // This perfectly allows anonymous public viewing while still restricting private drafts
    if (!portfolio.isPublic && portfolio.user?.id !== requestingUserId) {
      throw new UnauthorizedException('This portfolio is currently private.');
    }

    return portfolio;
  }

  /**
   * Processes a contact form submission from a portfolio visitor.
   */
  async sendContactForm(slug: string, contactFormDto: ContactFormDto): Promise<void> {
    const portfolio = await this.findOneBySlug(slug);
    
    // Safety check: ensure the owner has an email address
    if (!portfolio.user?.email) {
      throw new NotFoundException('Portfolio owner email not found.');
    }

    // Dispatch the emails
    await this.mailService.sendContactEmail(
      portfolio.user.email,
      contactFormDto.visitorEmail,
      contactFormDto.message
    );
  }

  /**
   * Replaces an existing portfolio entirely with new data.
   * First it validates ownership. Then it completely drops (`remove()`) the old portfolio tree 
   * and creates a brand new one. This handles complex nested updates elegantly without writing massive 
   * manual Diffing logic for every child array element (e.g. tracking reorders of projects/skills).
   */
  async updateBySlug(slug: string, updatePortfolioDto: CreatePortfolioDto, userId: string): Promise<Portfolio> {
    // 1. Retrieve the existing state using the standard localized fetch mechanism (inherently verifies slug validity)
    const existing = await this.findOneBySlug(slug, userId);
    
    // 2. Strict ownership validation to prevent authenticated users from mutating other users' data
    if (existing.user?.id !== userId) {
        throw new UnauthorizedException('You can only edit your own portfolio');
    }
    
    // 3. Drop the old tree completely. Due to TypeORM `{ cascade: true, onDelete: 'CASCADE' }` 
    // rules on the entities, this implicitly cleans up all nested child rows (e.g. old experiences)
    // without manual array diffing or soft-delete tracking.
    await this.portfolioRepository.remove(existing);
    
    // 4. Construct the brand new unified tree incorporating all updated nested payloads
    const portfolio = this.portfolioRepository.create(updatePortfolioDto);
    portfolio.user = { id: userId } as User;
    return await this.portfolioRepository.save(portfolio);
  }

  /**
   * Deletes a portfolio and all its cascaded relational data permanently from the database.
   * Enforces strict ownership validation if a userId is provided.
   */
  async deleteBySlug(slug: string, userId?: string): Promise<void> {
    const portfolio = await this.findOneBySlug(slug, userId);
    
    // Validate ownership
    if (userId && portfolio.user?.id !== userId) {
        throw new UnauthorizedException('You can only delete your own portfolio');
    }
    await this.portfolioRepository.remove(portfolio);
  }
}
