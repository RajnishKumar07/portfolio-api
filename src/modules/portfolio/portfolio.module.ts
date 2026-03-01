import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { Portfolio } from './entities/portfolio.entity';
import { PersonalInfo } from './entities/personal-info.entity';
import { Experience } from './entities/experience.entity';
import { Education } from './entities/education.entity';
import { Project } from './entities/project.entity';
import { Skill } from './entities/skill.entity';
import { Certification } from './entities/certification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Portfolio,
      PersonalInfo,
      Experience,
      Education,
      Project,
      Skill,
      Certification,
    ]),
  ],
  providers: [PortfolioService],
  controllers: [PortfolioController],
})
export class PortfolioModule {}
