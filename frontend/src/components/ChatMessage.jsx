import { useEffect, useState } from 'react';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChartRenderer from './ChartRenderer';

/**
 * A single chat message bubble with distinct layouts for user and AI.
 */
export default function ChatMessage({ role, content, timestamp }) {
  const [cleanContent, setCleanContent] = useState('');
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (role === 'user') {
      setCleanContent(content);
      return;
    }

    // Attempt to extract a JSON block intended for chart rendering
    try {
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = content.match(jsonRegex);
      
      let parsedChart = null;
      let textContent = content;

      if (match && match[1]) {
        parsedChart = JSON.parse(match[1]);
        // Remove the JSON block from the text content so it doesn't show in the chat bubble
        textContent = content.replace(match[0], '').trim();
      }

      setCleanContent(textContent);
      
      if (parsedChart && parsedChart.chartType && parsedChart.data) {
        setChartData(parsedChart);
      }
    } catch (e) {
      console.warn('[ChatMessage] Failed to parse JSON block from AI response:', e);
      setCleanContent(content); // Fallback to raw text if parsing fails
    }
  }, [content, role]);

  const isAI = role === 'ai';
  const time = timestamp
    ? new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex gap-3 animate-slide-up ${isAI ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isAI ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'}`}>
        {isAI ? <Bot size={15} strokeWidth={2.5} /> : <User size={15} strokeWidth={2.5} />}
      </div>

      {/* Content */}
      <div className={`flex flex-col max-w-[85%] ${isAI ? 'items-start' : 'items-end'}`}>
        <div className={`px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed break-words overflow-hidden ${
          isAI
            ? 'bg-slate-50 text-slate-800 rounded-tl-md border border-slate-100 prose prose-sm prose-slate max-w-none'
            : 'bg-emerald-600 text-white rounded-tr-md shadow-sm'
        }`}>
          {isAI ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {cleanContent}
            </ReactMarkdown>
          ) : (
            cleanContent
          )}
        </div>

        {/* Dynamic Chart Rendering */}
        {chartData && (
          <div className="w-full max-w-2xl mt-2">
            <ChartRenderer chartType={chartData.chartType} data={chartData.data} />
          </div>
        )}

        {time && <span className="text-[10px] text-slate-300 mt-1.5 px-1">{time}</span>}
      </div>
    </div>
  );
}
