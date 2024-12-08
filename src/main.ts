import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
export const maxDuration = 50;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const options = new DocumentBuilder()
    .setTitle('Parsing Tool')
    .setDescription('API for parsing pages to objects.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  // if (process.env.NODE_ENV == 'development') app.enableCors();
  // else {
  //   app.enableCors({
  //     origin: ['https://dance-helper-app.vercel.app'],
  //     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  //     preflightContinue: false,
  //     optionsSuccessStatus: 204,
  //     credentials: true,
  //   });
  // }

  await app.listen(process.env.PORT || '3001');
}
bootstrap();
