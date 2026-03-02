import { Controller, Get, Post, Body, Param, UseGuards, Delete, Put } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard';
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

  @Get('user/me')
  @UseGuards(AuthGuard)
  findAllByUser(@CurrentUser() user: any) {
    return this.portfolioService.findAllByUser(user.userId);
  }

  @Get(':slug')
  @UseGuards(OptionalAuthGuard)
  findOne(@Param('slug') slug: string, @CurrentUser() user: any) {
    return this.portfolioService.findOneBySlug(slug, user?.userId);
  }

  @Put(':slug')
  @UseGuards(AuthGuard)
  update(
    @Param('slug') slug: string,
    @Body() updatePortfolioDto: CreatePortfolioDto,
    @CurrentUser() user: any,
  ) {
    return this.portfolioService.updateBySlug(slug, updatePortfolioDto, user.userId);
  }

  @Delete(':slug')
  @UseGuards(AuthGuard)
  delete(@Param('slug') slug: string, @CurrentUser() user: any) {
    return this.portfolioService.deleteBySlug(slug, user.userId);
  }
}
