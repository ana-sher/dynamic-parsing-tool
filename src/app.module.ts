import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { CreatorModule } from './creator/creator.module';

@Module({
  imports: [CreatorModule],
  providers: [AppService],
})
export class AppModule {}
