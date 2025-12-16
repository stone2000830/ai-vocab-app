const { GoogleGenerativeAI } = require("@google/generative-ai");

// 👇 填入你的 Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log("正在连接 Google 查询可用模型...");
    // 获取模型列表
    const modelResponse = await genAI.getGenerativeModel({ model: "gemini-pro" }); 
    // 上面这行其实不用改，我们主要看下面这个 listSharedModels 或类似调用
    // 修正：SDK 没有直接 listModels 的简单方法，我们用 fetch 直接调 API
    
    // 我们用最原始的 fetch 来查，绕过 SDK 的封装，看看到底怎么回事
    const key = process.env.GEMINI_API_KEY; // 👈 再填一次 Key
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log("=== Google 返回的菜单 ===");
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error("查询失败:", error);
  }
}

listModels();