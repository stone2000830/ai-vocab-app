import { Controller, Get, Post, Body } from '@nestjs/common';
import { WordService } from './word.service';

@Controller('word')
export class WordController {
  constructor(private readonly wordService: WordService) {}

  // POST /word - 添加单词
  @Post()
  create(@Body() createWordDto: any) {
    return this.wordService.create(createWordDto);
  }

  // GET /word - 获取列表
  @Get()
  findAll() {
    return this.wordService.findAll();
  }
}
