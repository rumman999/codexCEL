import { useEffect } from 'react';
import { BarChart3, Bot, User } from 'lucide-react';

/**
 * A single chat message bubble with distinct layouts for user and AI.
 */
export default function ChatMessage({ role, content, timestamp, hasChart = false, chartSlot = null }) {
  useEffect(() => {
    console.log(`[ChatMessage] Rendered ${role} message:`, content?.substring(0, 60));
  }, []);

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
      <div className={`flex flex-col max-w-[75%] ${isAI ? 'items-start' : 'items-end'}`}>
        <div className={`px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed ${
          isAI
            ? 'bg-slate-50 text-slate-700 rounded-tl-md border border-slate-100'
            : 'bg-emerald-600 text-white rounded-tr-md shadow-sm'
        }`}>
          {content}
        </div>

        {/* Chart Skeleton */}
        {isAI && hasChart && (
          <div className="mt-3 w-full max-w-md">
            {chartSlot || (
              <div className="rounded-xl border border-slate-100 bg-white p-4 animate-fade-in shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={13} className="text-emerald-500" />
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Chart Preview</span>
                </div>
                <div className="flex items-end gap-1.5 h-28">
                  {[65, 85, 45, 70, 55, 90, 40, 75].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t skeleton-shimmer" style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
                <div className="flex justify-between mt-2.5 px-0.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => (
                    <div key={i} className="w-5 h-1.5 rounded-sm skeleton-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {time && <span className="text-[10px] text-slate-300 mt-1.5 px-1">{time}</span>}
      </div>
    </div>
  );
}
