import { Module } from '@nestjs/common';
// 👇 关键修复：必须导入 ConfigModule，否则下面会报错
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { WordModule } from './word/word.module';

@Module({
  imports: [
    // 注册配置模块，让它读取 .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    WordModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
