// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class WordService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private prisma: PrismaService) {
    // 初始化时打印一下 Key 的状态
    const key = process.env.GEMINI_API_KEY;
    console.log("--------------- 系统初始化 ---------------");
    console.log("正在检查 API Key:", key ? `✅ Key存在 (长度:${key.length})` : "❌ Key 丢失 (undefined)");

    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    }
  }

  // 添加单词 (接入 AI)
  // 👇 替换掉原来的 create 方法
  async create(createWordDto: any) {
    // 1. 提取单词
    const word = createWordDto.word || createWordDto.text;
    console.log(`👉 开始处理单词: [${word}]`);

    // 2. 准备 Prompt (确保要求 AI 返回 meaning, ukPhonetic, usPhonetic)
    const prompt = `
      请解释单词 "${word}"。
      请返回且仅返回一个纯 JSON 格式的字符串，不要包含 Markdown 标记。
      JSON 格式要求如下：
      {
        "word": "${word}",
        "meaning": "中文释义",
        "example": "一句英文例句",
        "ukPhonetic": "英式音标(IPA)", 
        "usPhonetic": "美式音标(IPA)"
      }
    `;

    try {
      console.log('⏳ 正在请求 Google Gemini API...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // 3. 清理 AI 返回的格式 (去掉 ```json 等杂质)
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
      }

      console.log(`✅ 解析后的 JSON: ${text}`);
      const wordInfo = JSON.parse(text);

      // 4. 存入数据库 (使用 upsert 防止重复报错)
      // 注意：这里手动映射字段，防止 AI 返回字段名不对
      return await this.prisma.word.upsert({
        where: { text: wordInfo.word },
        update: {
          definition: wordInfo.meaning,      // 对应数据库的 meaning
          example: wordInfo.example,
          ukPhonetic: wordInfo.ukPhonetic,
          usPhonetic: wordInfo.usPhonetic,
        },
        create: {
          text: wordInfo.word,
          definition: wordInfo.meaning,      // 对应数据库的 meaning
          example: wordInfo.example,
          ukPhonetic: wordInfo.ukPhonetic,
          usPhonetic: wordInfo.usPhonetic,
        },
      });

    } catch (error) {
      console.error('💥 处理失败:', error);
      throw error;
    }
  }

  async findAll() {
    return await this.prisma.word.findMany({ orderBy: { createdAt: 'desc' } });
  }
}