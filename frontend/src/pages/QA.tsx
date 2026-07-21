import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Lightbulb, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { askQuestion } from '../api/endpoints';
import EmptyState from '../components/EmptyState';

interface Message {
  id: string;
  type: 'question' | 'answer';
  content: string;
  data?: any[];
}

const exampleQueries = [
  'deadline minggu ini',
  'project aktif',
  'project terlambat',
  'reminder terdekat',
    'update <org-slug>',
  'Coune LabWorks minggu ini',
  'tugas hari ini',
];

export default function QA() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAsk = async (query?: string) => {
    const q = query || input.trim();
    if (!q) return;

    const questionMsg: Message = { id: Date.now().toString(), type: 'question', content: q };
    setMessages((prev) => [...prev, questionMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await askQuestion(q);
      const answerMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'answer',
        content: res.data.answer,
        data: res.data.data,
      };
      setMessages((prev) => [...prev, answerMsg]);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Q&A</h1>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <EmptyState
              icon={MessageSquare}
              title="Ask me anything about your operations"
              description="Try one of these questions to get started:"
            />
            <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-lg">
              {exampleQueries.map((q) => (
                <button
                  key={q}
                  onClick={() => handleAsk(q)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-urtrack-100 text-urtrack-700 hover:bg-urtrack-200 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'question' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.type === 'question'
                      ? 'bg-urtrack-600 text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.data && msg.data.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <details>
                        <summary className="text-xs font-medium text-urtrack-600 cursor-pointer hover:text-urtrack-700">
                          Related Data ({msg.data.length} items)
                        </summary>
                        <div className="mt-2 space-y-2">
                          {msg.data.map((item: any, i: number) => (
                            <div key={i} className="text-xs bg-gray-50 rounded-lg p-2">
                              {Object.entries(item).map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="font-medium text-gray-500 capitalize">{key}:</span>
                                  <span className="text-gray-700">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-urtrack-500 animate-spin" />
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your operations..."
            rows={1}
            className="flex-1 px-3 py-2 resize-none text-sm focus:outline-none"
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading || !input.trim()}
            className="flex items-center justify-center w-10 h-10 bg-urtrack-600 text-white rounded-lg hover:bg-urtrack-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
