import { useState, useEffect } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  FileSpreadsheet,
  Trash2,
  Plus,
  AlertCircle,
} from 'lucide-react';

/**
 * Collapsible left sidebar displaying past uploaded files and conversation history.
 */
export default function Sidebar({ files = [], onFileSelect, onClearHistory, onNewSession, activeFileId }) {
  const [collapsed, setCollapsed] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    console.log('[Sidebar] Component mounted. File count:', files.length);
    return () => console.log('[Sidebar] Component unmounted');
  }, []);

  useEffect(() => {
    console.log('[Sidebar] Files updated:', files.length, 'files loaded');
    if (files.length === 0) {
      console.log('[Sidebar] Empty state: No uploaded files');
    }
  }, [files]);

  const handleClear = () => {
    console.log('[Sidebar] Clearing all history...');
    try {
      onClearHistory?.();
      console.log('[Sidebar] History cleared successfully');
    } catch (err) {
      console.error('[Sidebar] Failed to clear history:', err);
      setLoadError('Failed to clear history');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <aside
      id="sidebar"
      className={`flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out h-screen sticky top-0 ${
        collapsed ? 'w-[60px]' : 'w-[272px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[56px] border-b border-slate-100 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5 animate-fade-in">
            <div className="w-[30px] h-[30px] rounded-lg bg-emerald-600 flex items-center justify-center">
              <FileSpreadsheet size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-[14px] tracking-tight text-slate-800">
              codex<span className="text-emerald-600">CEL</span>
            </span>
          </div>
        )}
        <button
          id="sidebar-toggle"
          onClick={() => {
            setCollapsed(!collapsed);
            console.log('[Sidebar] Toggled:', collapsed ? 'expanded' : 'collapsed');
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* New Session */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1 shrink-0">
          <button
            id="new-session-btn"
            onClick={() => {
              console.log('[Sidebar] Starting new session');
              onNewSession?.();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-200 text-slate-500 text-[13px] font-medium hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all duration-200"
          >
            <Plus size={15} strokeWidth={2} />
            New Session
          </button>
        </div>
      )}

      {/* Files List */}
      <div className="flex-1 overflow-y-auto px-3 pt-3">
        {!collapsed && (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 px-2 mb-2">
              Recent Files
            </p>

            {loadError && (
              <div className="flex items-center gap-2 px-2.5 py-2 mb-2 rounded-lg bg-red-50 text-red-600 text-xs border border-red-100">
                <AlertCircle size={13} />
                <span>{loadError}</span>
              </div>
            )}

            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                  <FileSpreadsheet size={18} className="text-slate-300" />
                </div>
                <p className="text-[12px] text-slate-400 leading-relaxed">
                  No files uploaded yet.<br />
                  Drop a spreadsheet to begin.
                </p>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {files.map((file) => (
                  <li key={file.id}>
                    <button
                      onClick={() => {
                        console.log('[Sidebar] Selected file:', file.original_name, 'ID:', file.id);
                        onFileSelect?.(file);
                      }}
                      className={`w-full flex items-start gap-2.5 px-2.5 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                        activeFileId === file.id
                          ? 'bg-emerald-50/70 border border-emerald-200/60'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div
                        className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          activeFileId === file.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'
                        } transition-colors`}
                      >
                        <FileSpreadsheet size={13} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-slate-700 truncate leading-tight">
                          {file.original_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[11px] text-slate-400">
                            {file.row_count} rows
                          </span>
                          <span className="text-slate-200 text-[11px]">/</span>
                          <span className="text-[11px] text-slate-400">
                            {formatSize(file.file_size)}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {collapsed && files.length > 0 && (
          <div className="flex flex-col items-center gap-1.5 pt-1">
            {files.slice(0, 5).map((file) => (
              <button
                key={file.id}
                onClick={() => onFileSelect?.(file)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  activeFileId === file.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                }`}
                title={file.original_name}
              >
                <FileSpreadsheet size={14} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!collapsed && files.length > 0 && (
        <div className="px-3 py-3 border-t border-slate-100 shrink-0">
          <button
            id="clear-history-btn"
            onClick={handleClear}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-slate-400 hover:text-red-500 hover:bg-red-50/60 transition-all duration-200"
          >
            <Trash2 size={13} />
            Clear History
          </button>
        </div>
      )}
    </aside>
  );
}
