import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { CreatorModule } from './creator/creator.module';

@Module({
  imports: [ConfigModule.forRoot(), CreatorModule],
  providers: [AppService],
})
export class AppModule {}
