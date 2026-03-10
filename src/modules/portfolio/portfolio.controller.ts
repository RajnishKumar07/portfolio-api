import { Controller, Get, Post, Body, Param, UseGuards, Delete, Put } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * REST Controller for managing Portfolios.
 * Handles HTTP requests for creating, reading, updating, and deleting portfolio data.
 * All modifying endpoints are securely protected by the `AuthGuard`.
 */
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  /**
   * Creates a new portfolio for the currently authenticated user.
   * @param createPortfolioDto The structured payload for the new portfolio.
   * @param user The authenticated user object injected by `@CurrentUser()`.
   */
  @Post()
  @UseGuards(AuthGuard)
  create(
    @Body() createPortfolioDto: CreatePortfolioDto,
    @CurrentUser() user: any,
  ) {
    return this.portfolioService.create({ ...createPortfolioDto, userId: user.userId } as any);
  }

  /**
   * Retrieves all portfolios belonging to the currently authenticated user.
   * Useful for the dashboard home screen list.
   * @param user The authenticated user object.
   */
  @Get('user/me')
  @UseGuards(AuthGuard)
  findAllByUser(@CurrentUser() user: any) {
    return this.portfolioService.findAllByUser(user.userId);
  }

  /**
   * Retrieves a single portfolio by its unique slug.
   * Uses an `OptionalAuthGuard` so both public guests and the authenticated owner can access it.
   * The Service logic determines if a private portfolio can be viewed based on the user ID.
   * @param slug The unique URL slug of the portfolio.
   * @param user The optionally authenticated user object.
   */
  @Get(':slug')
  @UseGuards(OptionalAuthGuard)
  findOne(@Param('slug') slug: string, @CurrentUser() user: any) {
    return this.portfolioService.findOneBySlug(slug, user?.userId);
  }

  /**
   * Updates an existing portfolio.
   * Security: The portfolioService will verify that the requesting user actually owns this portfolio before modifying it.
   * @param slug The slug of the portfolio to update.
   * @param updatePortfolioDto The new structured data for the portfolio.
   * @param user The authenticated user object making the request.
   */
  @Put(':slug')
  @UseGuards(AuthGuard)
  update(
    @Param('slug') slug: string,
    @Body() updatePortfolioDto: CreatePortfolioDto,
    @CurrentUser() user: any,
  ) {
    return this.portfolioService.updateBySlug(slug, updatePortfolioDto, user.userId);
  }

  /**
   * Deletes a portfolio entirely.
   * Security: The portfolioService verifies ownership before executing the delete.
   * @param slug The slug of the portfolio to delete.
   * @param user The authenticated user object making the request.
   */
  @Delete(':slug')
  @UseGuards(AuthGuard)
  delete(@Param('slug') slug: string, @CurrentUser() user: any) {
    return this.portfolioService.deleteBySlug(slug, user.userId);
  }
}
