import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 开启 CORS 允许跨域
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
