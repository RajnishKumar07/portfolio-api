import { Controller, Get, Post, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(
    @Body() createPortfolioDto: CreatePortfolioDto,
    @CurrentUser() user: any,
  ) {
    return this.portfolioService.create({ ...createPortfolioDto, userId: user.userId } as any);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.portfolioService.findOneBySlug(slug);
  }

  @Delete(':slug')
  delete(@Param('slug') slug: string) {
    return this.portfolioService.deleteBySlug(slug);
  }
}
