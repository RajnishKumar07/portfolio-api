import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
  ) {}

  async create(createPortfolioDto: CreatePortfolioDto): Promise<Portfolio> {
    const portfolio = this.portfolioRepository.create(createPortfolioDto);
    // Explicitly map the string userId (from our custom auth) into the user relation DB field if needed
    if ((createPortfolioDto as any).userId) {
      portfolio.user = { id: (createPortfolioDto as any).userId } as any;
    }
    return await this.portfolioRepository.save(portfolio);
  }

  async findAllByUser(userId: string): Promise<Portfolio[]> {
    return this.portfolioRepository.find({
      where: { user: { id: userId } },
      relations: ['personalInfo', 'experiences', 'educations', 'projects', 'skills', 'certifications'],
    });
  }

  async findOneBySlug(slug: string, requestingUserId?: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { slug },
      relations: ['user', 'personalInfo', 'experiences', 'educations', 'projects', 'skills', 'certifications'],
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with slug ${slug} not found.`);
    }

    if (!portfolio.isPublic && portfolio.user?.id !== requestingUserId) {
      throw new UnauthorizedException('This portfolio is currently private.');
    }

    return portfolio;
  }

  async updateBySlug(slug: string, updatePortfolioDto: CreatePortfolioDto, userId: string): Promise<Portfolio> {
    const existing = await this.findOneBySlug(slug, userId);
    
    if (existing.user?.id !== userId) {
        throw new UnauthorizedException('You can only edit your own portfolio');
    }
    
    await this.portfolioRepository.remove(existing);
    
    const portfolio = this.portfolioRepository.create(updatePortfolioDto);
    portfolio.user = { id: userId } as any;
    return await this.portfolioRepository.save(portfolio);
  }

  async deleteBySlug(slug: string, userId?: string): Promise<void> {
    const portfolio = await this.findOneBySlug(slug, userId);
    
    if (userId && portfolio.user?.id !== userId) {
        throw new UnauthorizedException('You can only delete your own portfolio');
    }
    await this.portfolioRepository.remove(portfolio);
  }
}
