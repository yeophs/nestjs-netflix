import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log'], // 해당 로그 레벨의 위 레벨인 로그들이 보임
  });
  // class validator를 사용하기 위해 GlobalPipe를 추가한다.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 애초에 정의하지 않은 값들은 전달되지 않는다.
      forbidNonWhitelisted: true, // 있으면 안되는 property를 금지한다.
      transformOptions: {
        enableImplicitConversion: true, // TypeScript로 입력된 타입 기반으로 변경(url은 기본적으로 string)
      },
    }),
  );
  await app.listen(3000);
}

bootstrap();
