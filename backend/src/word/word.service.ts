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
  async create(createWordDto: any) {
    const wordText = createWordDto.text;
    console.log(`\n👉 开始处理单词: [${wordText}]`);

    // 检查模型是否初始化
    if (!this.model) {
      console.log("❌ 错误：模型未初始化，可能是因为启动时没有读取到 Key");
      return this.saveToDb(wordText, '配置错误', '请检查后端 .env 文件');
    }

    const prompt = `
      You are an English teacher. 
      Explain the word "${wordText}" for a Chinese student.
      Please return ONLY a valid JSON object with the following format:
      {
        "definition": "Short Chinese definition (max 15 chars)",
        "example": "One simple English example sentence."
      }
    `;

    try {
      console.log("⏳ 正在请求 Google Gemini API (可能需要几秒钟)...");
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log("✅ Google API 返回成功，原始内容:", text);

      // 解析
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const aiData = JSON.parse(cleanJson);
      
      console.log("🎉 解析成功:", aiData);
      return this.saveToDb(wordText, aiData.definition, aiData.example);

    } catch (error) {
      console.log("💥 捕获到异常！！详情如下：");
      // 这里的 log 会把完整的错误对象打印出来
      console.log(JSON.stringify(error, null, 2));
      console.log("错误消息:", error.message);
      
      return this.saveToDb(wordText, 'AI生成失败', '请查看后端终端报错');
    }
  }

  // 辅助保存方法
  async saveToDb(text, definition, example) {
    console.log(`💾 正在存入数据库: ${text} | ${definition}`);
    return await this.prisma.word.create({
      data: { text, definition, example },
    });
  }

  async findAll() {
    return await this.prisma.word.findMany({ orderBy: { createdAt: 'desc' } });
  }
}