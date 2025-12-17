// @ts-nocheck
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class WordService implements OnModuleInit {
  private openai: OpenAI;
  private model: any;

  constructor(private prisma: PrismaService) {
    // 初始化时打印一下 Key 的状态
    const key = process.env.DEEPSEEK_API_KEY;
    console.log("--------------- 系统初始化 ---------------");
    console.log("正在检查 API Key:", key ? `✅ Key存在 (长度:${key.length})` : "❌ Key 丢失 (undefined)");

    if (key) {
      this.openai = new OpenAI({
        apiKey: key,
        baseURL: 'https://api.deepseek.com',
      });
      //this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
    }
  }

  // 添加单词 (接入 AI)
  // 👇 替换掉原来的 create 方法
  async create(createWordDto: any) {
    // ✅ 保护逻辑：如果由于某种原因 openai 没初始化，立即初始化它
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',
      });
    }

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

    // try {
    //   console.log('⏳ 正在请求 Google Gemini API...');
    //   const result = await this.model.generateContent(prompt);
    //   const response = await result.response;
    //   let text = response.text();

    //   // 3. 清理 AI 返回的格式 (去掉 ```json 等杂质)
    //   text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    //   const firstBrace = text.indexOf('{');
    //   const lastBrace = text.lastIndexOf('}');
    //   if (firstBrace !== -1 && lastBrace !== -1) {
    //     text = text.substring(firstBrace, lastBrace + 1);
    //   }
    try {
      // ✅ 替换原有的 Google 请求代码，改为 OpenAI 格式
      const response = await this.openai.chat.completions.create({
        model: 'deepseek-chat', // DeepSeek-V3 默认模型名
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });
      const text = response.choices[0].message.content;
      console.log(`✅ 解析后的 JSON: ${text}`);
      const wordInfo = JSON.parse(text);

      // 4. 存入数据库 (使用 upsert 防止重复报错)
      // 注意：这里手动映射字段，防止 AI 返回字段名不对npm run start:dev
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

      // 如果是 429 错误（限流），给前端返回一个友好的提示，而不是直接抛出异常让后端崩溃
      if (error.status === 429 || error.message?.includes('429')) {
        throw new HttpException('Google API 额度耗尽，请等几分钟再试', HttpStatus.TOO_MANY_REQUESTS);
      }

      throw error;
    }
  }

  async findAll() {
    return await this.prisma.word.findMany({ orderBy: { createdAt: 'desc' } });
  }
}