import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 문자열 -> number 변환 활성화
      whitelist: true, // DTO에 없는 키 제거
      forbidNonWhitelisted: true, // 허용되지 않은 키 들어오면 400
      transformOptions: { enableImplicitConversion : false }, // 명시적 Transform만
    }),
  );

  const port = parseInt(process.env.PORT ?? '3005', 10);
  await app.listen(port, '0.0.0.0'); // 컨테이너 외부에서도 접근 가능
}
bootstrap();
