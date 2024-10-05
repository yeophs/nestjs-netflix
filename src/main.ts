import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 애초에 정의하지 않은 값들은 전달되지 않는다.
      forbidNonWhitelisted: true, // 있으면 안되는 property를 금지한다.
    }),
  );
  await app.listen(3000);
}

bootstrap();
