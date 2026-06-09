import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  UploadCloud, FileSpreadsheet, X, AlertCircle, Loader2, CheckCircle2,
  Send, Bot, User, Sparkles, MessageSquare, AlertTriangle, Rows3, Columns3
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChartRenderer from '@/components/ChartRenderer';

export default function Dashboard() {
  const navigate = useNavigate();

  // --- Data State ---
  const [activeFile, setActiveFile] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [visibleRows, setVisibleRows] = useState(50);

  // --- Upload State ---
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, success, error
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  // --- Chat State ---
  const WELCOME_MESSAGES = [
    { role: 'ai', content: 'Welcome to codexCEL. Upload a spreadsheet and ask me anything about your data — I can generate charts, summarize trends, and surface insights.', timestamp: new Date().toISOString() },
  ];
  const [messages, setMessages] = useState(WELCOME_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatError, setChatError] = useState(null);
  const chatEndRef = useRef(null);

  // ==========================================
  // DATA FETCHING LOGIC
  // ==========================================
  const fetchFileData = async (fileId) => {
    setIsLoadingData(true);
    try {
      const res = await fetch(`/api/data/${fileId}`);
      if (!res.ok) {
        setTableData(null);
        return;
      }
      const data = await res.json();
      setTableData(data.rows || null);
    } catch (err) {
      console.error('[Dashboard] Error fetching file data:', err);
      setTableData(null);
    } finally {
      setIsLoadingData(false);
    }
  };

  // ==========================================
  // UPLOAD LOGIC
  // ==========================================
  const validateFile = (file) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      return { valid: false, reason: `Invalid file type "${ext}". Supported: .xlsx, .xls, .csv` };
    }
    if (file.size > 25 * 1024 * 1024) {
      return { valid: false, reason: 'File too large. Maximum size: 25MB' };
    }
    return { valid: true };
  };

  const uploadFile = async (file) => {
    setUploadState('uploading');
    setUploadProgress(`Uploading "${file.name}"...`);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setUploadState('success');
      setUploadProgress(`"${file.name}" processed — ${data.rowCount} rows, ${data.columnCount} columns`);

      setTimeout(() => {
        setActiveFile({
          id: data.id,
          original_name: data.originalName,
          row_count: data.rowCount,
          column_count: data.columnCount,
        });
        setMessages([
          ...WELCOME_MESSAGES,
          { role: 'ai', content: `I've loaded "${data.originalName}". Ask me to analyze trends, create charts, or summarize your data.`, timestamp: new Date().toISOString() },
        ]);
        fetchFileData(data.id);
      }, 800);
    } catch (err) {
      setUploadState('error');
      setUploadError(err.message);
    }
  };

  const handleFile = useCallback((file) => {
    if (!file) return;
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadState('error');
      setUploadError(validation.reason);
      return;
    }
    uploadFile(file);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget)) setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, [handleFile]);

  // ==========================================
  // CHAT LOGIC
  // ==========================================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping || !activeFile) return;

    setChatError(null);
    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: activeFile.id, message: text }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await res.json();
      const aiMsg = { role: 'ai', content: data.response, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setChatError(err.message);
      setMessages((prev) => [...prev, { role: 'ai', content: `I encountered an error: ${err.message}. Please try again.`, timestamp: new Date().toISOString() }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Helper to parse AI markdown for Chart JSON
  const renderMessageContent = (content, role) => {
    if (role === 'user') return content;
    
    try {
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = content.match(jsonRegex);
      let textContent = content;
      let chartData = null;

      if (match && match[1]) {
        chartData = JSON.parse(match[1]);
        textContent = content.replace(match[0], '').trim();
      }

      return (
        <div className="flex flex-col gap-3 w-full">
          {textContent && (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{textContent}</ReactMarkdown>
            </div>
          )}
          {chartData && chartData.chartType && chartData.data && (
            <div className="w-full mt-2">
              <ChartRenderer chartType={chartData.chartType} data={chartData.data} />
            </div>
          )}
        </div>
      );
    } catch (e) {
      return (
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      );
    }
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  const renderUploadZone = () => (
    <div className="flex-1 flex items-center justify-center p-8 bg-white h-full">
      <div
        ref={dropRef}
        onClick={() => { if (uploadState !== 'uploading') fileInputRef.current?.click(); }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative w-full max-w-lg cursor-pointer rounded-xl border-2 border-dashed
          transition-all duration-300 ease-out flex flex-col items-center justify-center py-16 px-6
          ${isDragging ? 'border-emerald-400 bg-emerald-50/40 scale-[1.01] shadow-sm' : 
            uploadState === 'error' ? 'border-red-200 bg-red-50/30' : 
            uploadState === 'success' ? 'border-emerald-300 bg-emerald-50/30' : 
            'border-slate-200 hover:border-emerald-300 hover:bg-slate-50/50'}
        `}
      >
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300
          ${isDragging ? 'bg-emerald-600 text-white scale-110' : 
            uploadState === 'uploading' ? 'bg-emerald-50 text-emerald-600' : 
            uploadState === 'error' ? 'bg-red-50 text-red-500' : 
            uploadState === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}
        `}>
          {uploadState === 'uploading' ? <Loader2 size={24} className="animate-spin" /> : 
           uploadState === 'error' ? <AlertCircle size={24} /> : 
           uploadState === 'success' ? <CheckCircle2 size={24} /> : <UploadCloud size={24} />}
        </div>

        {uploadState === 'idle' && (
          <div className="text-center">
            <p className="text-[15px] font-semibold text-slate-700 mb-1">{isDragging ? 'Release to upload' : 'Drag & drop your spreadsheet'}</p>
            <p className="text-[13px] text-slate-400 mb-5">or <span className="text-emerald-600 font-medium">browse files</span></p>
            <div className="flex items-center justify-center gap-2.5">
              {['.xlsx', '.csv'].map(ext => (
                <span key={ext} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-[11px] font-medium text-slate-500">
                  <FileSpreadsheet size={11} strokeWidth={2} />{ext}
                </span>
              ))}
            </div>
          </div>
        )}
        {uploadState === 'uploading' && (
          <div className="text-center w-full max-w-[200px]"><p className="text-[13px] font-medium text-emerald-700 mb-3">{uploadProgress}</p></div>
        )}
        {uploadState === 'error' && (
          <div className="text-center"><p className="text-[13px] font-medium text-red-600 mb-3">{uploadError}</p></div>
        )}
      </div>
    </div>
  );

  const renderDataTable = () => {
    if (isLoadingData) {
      return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>;
    }
    if (!tableData || tableData.length === 0) return null;

    const headers = tableData[0] || [];
    const rows = tableData.slice(1, visibleRows + 1);

    return (
      <div className="flex flex-col h-full w-full">
        {/* Table Header Info */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <FileSpreadsheet size={13} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-800 leading-tight">{activeFile.original_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-[11px] text-slate-400"><Rows3 size={10} /> {activeFile.row_count?.toLocaleString()} rows</span>
                <span className="text-slate-200 text-[11px]">/</span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400"><Columns3 size={10} /> {activeFile.column_count} columns</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => { setActiveFile(null); setUploadState('idle'); setTableData(null); }}>
            <X size={16} /> Close
          </Button>
        </div>

        {/* Scrollable shadcn Table */}
        <ScrollArea className="flex-1 w-full bg-white relative">
          <div className="min-w-max p-4 pb-10">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white shadow-sm ring-1 ring-slate-100">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 text-center text-xs border-r border-slate-100">#</TableHead>
                  {headers.map((h, i) => (
                    <TableHead key={i} className="text-xs font-semibold whitespace-nowrap min-w-[120px] border-r border-slate-100">{h || `Col ${i + 1}`}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, rIdx) => (
                  <TableRow key={rIdx} className="hover:bg-emerald-50/50">
                    <TableCell className="text-center text-xs text-slate-400 font-mono border-r border-slate-100 bg-slate-50/30">{rIdx + 1}</TableCell>
                    {headers.map((_, cIdx) => (
                      <TableCell key={cIdx} className="text-xs text-slate-700 whitespace-nowrap border-r border-slate-50 max-w-[250px] truncate">
                        {row[cIdx] !== undefined && row[cIdx] !== null ? String(row[cIdx]) : ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {visibleRows < (tableData.length - 1) && (
              <div className="py-4 text-center">
                <Button variant="outline" size="sm" onClick={() => setVisibleRows(v => v + 50)}>Load More Rows</Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  // ==========================================
  // MAIN RENDER
  // ==========================================
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 p-4 flex gap-4">
      {/* Left Column (Data Workspace - 60%) */}
      <Card className="w-[60%] flex flex-col h-full overflow-hidden border-slate-200 shadow-sm bg-white rounded-xl">
        {!activeFile ? renderUploadZone() : renderDataTable()}
      </Card>

      {/* Right Column (AI Chat - 40%) */}
      <Card className="w-[40%] flex flex-col h-full overflow-hidden border-slate-200 shadow-sm bg-white rounded-xl">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Sparkles size={14} className="text-emerald-600" />
            </div>
            <span className="text-sm font-semibold text-slate-800">AI Assistant</span>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500" onClick={() => navigate('/')}>
            Exit
          </Button>
        </div>

        {/* Message Area */}
        <ScrollArea className="flex-1 p-4 bg-slate-50/30">
          <div className="space-y-6 pb-4">
            {messages.map((msg, i) => {
              const isAI = msg.role === 'ai';
              return (
                <div key={i} className={`flex gap-3 animate-fade-in ${isAI ? '' : 'flex-row-reverse'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${
                    isAI ? 'bg-white border-slate-200 text-emerald-600' : 'bg-emerald-100 border-emerald-200 text-emerald-700'
                  }`}>
                    {isAI ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  
                  {/* Bubble */}
                  <div className={`flex flex-col max-w-[85%] ${isAI ? 'items-start' : 'items-end'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap shadow-sm ${
                      isAI 
                        ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm' 
                        : 'bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-tr-sm'
                    }`}>
                      {renderMessageContent(msg.content, msg.role)}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            {isTyping && (
               <div className="flex gap-3 animate-fade-in">
                 <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border bg-white border-slate-200 text-emerald-600">
                   <Bot size={16} />
                 </div>
                 <div className="px-4 py-4 rounded-2xl rounded-tl-sm bg-white border border-slate-200 shadow-sm">
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
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          {chatError && (
            <div className="flex items-center gap-1.5 text-xs text-red-500 mb-2 px-1">
              <AlertTriangle size={12} />
              <span>{chatError}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
              placeholder={activeFile ? "Ask a question about your data..." : "Upload a spreadsheet first..."}
              disabled={!activeFile || isTyping}
              className="flex-1 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 h-11 rounded-xl shadow-sm"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim() || !activeFile || isTyping}
              className="h-11 w-11 rounded-xl shrink-0 shadow-md bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white border-0 transition-all active:scale-95"
            >
              {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
