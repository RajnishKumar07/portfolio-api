import { Injectable, NotFoundException } from '@nestjs/common';
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
    return await this.portfolioRepository.save(portfolio);
  }

  async findOneBySlug(slug: string): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { slug },
      relations: ['personalInfo', 'experiences', 'educations', 'projects', 'skills', 'certifications'],
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with slug ${slug} not found.`);
    }

    return portfolio;
  }

  async deleteBySlug(slug: string): Promise<void> {
    const portfolio = await this.findOneBySlug(slug);
    await this.portfolioRepository.remove(portfolio);
  }
}
