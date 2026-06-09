import { useState, useEffect, useRef } from 'react';
import { Send, Bot, Sparkles, MessageSquare, Loader2, AlertTriangle } from 'lucide-react';
import ChatMessage from './ChatMessage';

const WELCOME_MESSAGES = [
  { role: 'ai', content: 'Welcome to SheetGenie. Upload a spreadsheet and ask me anything about your data — I can generate charts, summarize trends, and surface insights.', timestamp: new Date().toISOString() },
];

export default function ChatInterface({ fileId, fileName }) {
  const [messages, setMessages] = useState(WELCOME_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    console.log('[ChatInterface] Mounted. FileID:', fileId || 'none');
    return () => console.log('[ChatInterface] Unmounted');
  }, []);

  useEffect(() => {
    if (fileId) {
      console.log('[ChatInterface] Active file changed:', fileId, fileName);
      setMessages([
        ...WELCOME_MESSAGES,
        { role: 'ai', content: `I've loaded "${fileName}". Ask me to analyze trends, create charts, or summarize your data.`, timestamp: new Date().toISOString() },
      ]);
    }
  }, [fileId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    console.log('[ChatInterface] Sending message:', text);
    setError(null);

    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      console.log('[ChatInterface] Awaiting AI response...');
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const aiMsg = {
        role: 'ai',
        content: `I'd analyze that for you. Once the OpenAI integration is connected, I'll provide detailed insights about "${text}". Here's a chart placeholder showing what the response would look like.`,
        timestamp: new Date().toISOString(),
        hasChart: text.toLowerCase().includes('chart') || text.toLowerCase().includes('graph') || text.toLowerCase().includes('plot'),
      };
      setMessages((prev) => [...prev, aiMsg]);
      console.log('[ChatInterface] AI response received');
    } catch (err) {
      console.error('[ChatInterface] AI response error:', err);
      setError(err.message);
      const errorMsg = { role: 'ai', content: `I encountered an error: ${err.message}. Please try again.`, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-100 shrink-0">
        <div className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <Sparkles size={12} className="text-emerald-600" />
        </div>
        <span className="text-[13px] font-semibold text-slate-700">AI Assistant</span>
        {fileId && (
          <span className="text-[11px] text-slate-400 ml-auto font-medium">
            Analyzing: {fileName}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
              <MessageSquare size={20} className="text-slate-300" />
            </div>
            <p className="text-[13px] font-medium text-slate-500 mb-1">No messages yet</p>
            <p className="text-[12px] text-slate-400">Upload a file and start asking questions</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <ChatMessage key={i} {...msg} />
          ))
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
              <Bot size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-100 shrink-0">
        {error && (
          <div className="flex items-center gap-1.5 text-[12px] text-red-500 mb-2 px-1">
            <AlertTriangle size={12} />
            <span>{error}</span>
          </div>
        )}
        <div className="flex items-end gap-2.5">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={fileId ? "Ask about your data..." : "Upload a file first to start chatting..."}
              disabled={!fileId}
              rows={1}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            id="send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || isTyping || !fileId}
            className="flex items-center justify-center w-[44px] h-[44px] rounded-xl bg-emerald-600 text-white hover:bg-green-700 active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 disabled:active:scale-100 shrink-0 shadow-sm"
          >
            {isTyping ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
          </button>
        </div>
      </div>
    </div>
  );
}
