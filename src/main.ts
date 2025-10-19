import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT || 3000);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 문자열 -> number 변환 활성화
      whitelist: true, // DTO에 없는 키 제거
      forbidNonWhitelisted: true, // 허용되지 않은 키 들어오면 400
      transformOptions: { enableImplicitConversion : false }, // 명시적 Transform만
    }),
  );
}
bootstrap();
