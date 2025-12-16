import { useState, useEffect } from 'react'

// 定义单词的数据结构 (和后端保持一致)
interface Word {
  id: number;
  text: string;
  definition: string;
  example: string;
  createdAt: string;
  kPhonetic: string;  // 英式音标
  usPhonetic: string;  // 美式音标
}

function App() {
  const [words, setWords] = useState<Word[]>([]); // 存储单词列表
  const [input, setInput] = useState('');         // 存储输入框的内容
  const [loading, setLoading] = useState(false);  // 加载状态

  // 1. 页面加载时，获取单词列表
  useEffect(() => {
    fetchWords();
  }, []);

  const fetchWords = async () => {
    try {
      //const res = await fetch('http://localhost:3000/word');        
      const res = await fetch('https://luoai.zeabur.app/word');   
      const data = await res.json();
      // 🛡️ 安全检查：只有当 data 真的是数组时，才更新；否则设为空数组
      if (Array.isArray(data)) {
        setWords(data);
      } else {
        console.error("后端返回异常:", data);
        setWords([]); // 设为空，防止 .map 报错
      }
    } catch (error) {
      console.error("获取失败:", error);
    }
  };
  const speak = (text: string, accent: string) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = accent;
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };
  // 2. 添加单词
  const handleAdd = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      // 发送请求给后端
      const res = await fetch('https://luoai.zeabur.app/word', {  
      //const res = await fetch('http://localhost:3000/word', {       
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });

      if (res.ok) {
        setInput('');   // 清空输入框
        fetchWords();   // 刷新列表
      }
    } catch (error) {
      console.error("添加失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          📒 AI 单词本
        </h1>

        {/* 输入区域 */}
        <div className="flex gap-2 mb-8">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入想记的单词..."
            className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          >
            {loading ? '添加中...' : '添加'}
          </button>
        </div>

        {/* 单词列表 */}
        <div className="space-y-4">
          {words.map((word) => (
            <div key={word.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              {/* 单词标题 */}
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4 text-center">{word.text}</h2>

              {/* 音标与发音行 */}
              <div className="flex justify-center items-center gap-6 mb-6 text-sm text-gray-600">

                {/* 🇬🇧 英式 */}
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                  <span className="font-serif text-gray-500">英</span>
                  <span className="font-mono text-gray-800">[{word.kPhonetic || ' - '}]</span>
                  <button
                    onClick={() => speak(word.text, 'en-GB')}
                    className="p-1.5 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
                    title="英式发音"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                  </button>
                </div>

                {/* 🇺🇸 美式 */}
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                  <span className="font-serif text-gray-500">美</span>
                  <span className="font-mono text-gray-800">[{word.usPhonetic || ' - '}]</span>
                  <button
                    onClick={() => speak(word.text, 'en-US')}
                    className="p-1.5 rounded-full hover:bg-red-100 text-red-600 transition-colors"
                    title="美式发音"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                  </button>
                </div>

              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">
                  {new Date(word.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-600 mb-1">
                <span className="font-semibold text-blue-600">释义：</span>
                {word.definition}
              </p>
              <p className="text-gray-500 text-sm italic">
                <span className="font-semibold text-purple-600">例句：</span>
                {word.example}
              </p>
            </div>
          ))}

          {words.length === 0 && (
            <div className="text-center text-gray-400 py-10">
              还没有单词，快去添加一个吧！🚀
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App