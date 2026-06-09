import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import UploadZone from './components/UploadZone';
import DataTable from './components/DataTable';
import ChatInterface from './components/ChatInterface';
import './App.css';

function App() {
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState(null);

  // ─── Lifecycle ──────────────────────────────────────
  useEffect(() => {
    console.log('[App] codexCEL dashboard mounted');
    fetchFiles();
    return () => console.log('[App] Dashboard unmounted');
  }, []);

  // ─── Fetch file list from backend ───────────────────
  const fetchFiles = async () => {
    console.log('[App] Fetching files...');
    setIsLoadingFiles(true);
    try {
      const res = await fetch('/api/files');
      if (!res.ok) throw new Error(`Failed to fetch files: ${res.statusText}`);
      const data = await res.json();
      console.log('[App] Files loaded:', data.files?.length || 0);
      setFiles(data.files || []);
    } catch (err) {
      console.error('[App] Error fetching files:', err);
      setError(err.message);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // ─── Fetch file data for table preview ──────────────
  const fetchFileData = async (fileId) => {
    console.log('[App] Fetching data for file:', fileId);
    setIsLoadingData(true);
    try {
      const res = await fetch(`/api/data/${fileId}`);
      if (!res.ok) {
        console.warn('[App] Data endpoint not available, using placeholder');
        setTableData(null);
        return;
      }
      const data = await res.json();
      console.log('[App] File data loaded:', data.rows?.length, 'rows');
      setTableData(data.rows || null);
    } catch (err) {
      console.error('[App] Error fetching file data:', err);
      setTableData(null);
    } finally {
      setIsLoadingData(false);
    }
  };

  // ─── Upload success handler ─────────────────────────
  const handleUploadSuccess = useCallback((uploadResult) => {
    console.log('[App] Upload success:', uploadResult);
    setActiveFile({
      id: uploadResult.id,
      original_name: uploadResult.originalName,
      row_count: uploadResult.rowCount,
      column_count: uploadResult.columnCount,
    });
    fetchFiles();
    fetchFileData(uploadResult.id);
  }, []);

  // ─── Select file from sidebar ───────────────────────
  const handleFileSelect = useCallback((file) => {
    console.log('[App] File selected:', file.original_name);
    setActiveFile(file);
    fetchFileData(file.id);
  }, []);

  // ─── Clear history ─────────────────────────────────
  const handleClearHistory = useCallback(async () => {
    console.log('[App] Clearing all history...');
    try {
      for (const file of files) {
        await fetch(`/api/files/${file.id}`, { method: 'DELETE' });
      }
      setFiles([]);
      setActiveFile(null);
      setTableData(null);
      console.log('[App] History cleared');
    } catch (err) {
      console.error('[App] Error clearing history:', err);
    }
  }, [files]);

  // ─── New session ───────────────────────────────────
  const handleNewSession = useCallback(() => {
    console.log('[App] Starting new session');
    setActiveFile(null);
    setTableData(null);
  }, []);

  // ─── Close table preview ──────────────────────────
  const handleClosePreview = useCallback(() => {
    console.log('[App] Closing table preview');
    setActiveFile(null);
    setTableData(null);
  }, []);

  const hasData = !!(activeFile && tableData);

  return (
    <div className="app-layout">
      <Sidebar
        files={files}
        onFileSelect={handleFileSelect}
        onClearHistory={handleClearHistory}
        onNewSession={handleNewSession}
        activeFileId={activeFile?.id}
      />

      <div className="workspace">
        {/* Top Panel — Upload / Data Preview */}
        <div className="workspace__top">
          {isLoadingData ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3 animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Loader2 size={20} className="text-emerald-600 animate-spin" />
                </div>
                <p className="text-sm text-slate-400">Loading spreadsheet data...</p>
              </div>
            </div>
          ) : hasData ? (
            <DataTable
              data={tableData}
              fileName={activeFile.original_name}
              onClose={handleClosePreview}
            />
          ) : (
            <UploadZone
              onUploadSuccess={handleUploadSuccess}
              hasData={false}
            />
          )}
        </div>

        {/* Bottom Panel — AI Chat */}
        <div className="workspace__bottom">
          <ChatInterface
            fileId={activeFile?.id}
            fileName={activeFile?.original_name}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
