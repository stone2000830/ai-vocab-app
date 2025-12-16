import { Module } from '@nestjs/common';
import { WordService } from './word.service';
import { WordController } from './word.controller';
import { PrismaModule } from '../prisma/prisma.module'; // 导入 PrismaModule

@Module({
  imports: [PrismaModule], // 引入 PrismaModule
  controllers: [WordController],
  providers: [WordService],
})
export class WordModule {}
