import { useState, useEffect } from 'react'

// 定义单词的数据结构 (和后端保持一致)
interface Word {
  id: number;
  text: string;
  definition: string;
  example: string;
  createdAt: string;
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
      const res = await fetch('https://luoai.zeabur.app/word');
      const data = await res.json();
      setWords(data);
    } catch (error) {
      console.error("获取失败:", error);
    }
  };

  // 2. 添加单词
  const handleAdd = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    try {
      // 发送请求给后端
      const res = await fetch('https://luoai.zeabur.app/word', {
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
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-gray-900">{word.text}</h3>
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