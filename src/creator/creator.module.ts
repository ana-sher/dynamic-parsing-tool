import { Module, HttpModule } from '@nestjs/common';
import { CreatorController } from './creator.controller';
import { ParsingService } from './parsing.service';
@Module({
  imports: [HttpModule],
  controllers: [CreatorController],
  providers: [ParsingService],
})
export class CreatorModule {}
