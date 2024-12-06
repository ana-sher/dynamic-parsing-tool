import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CreatorController } from './creator.controller';
import { ParsingService } from './parsing.service';
@Module({
  imports: [HttpModule],
  controllers: [CreatorController],
  providers: [ParsingService],
})
export class CreatorModule {}
