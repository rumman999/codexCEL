import { useState, useCallback, useEffect, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

/**
 * Drag-and-drop upload zone for .xlsx files.
 * Shows upload progress and transitions to callback on success.
 */
export default function UploadZone({ onUploadSuccess, hasData = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState('idle');
  const [uploadProgress, setUploadProgress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    console.log('[UploadZone] Component mounted');
    return () => console.log('[UploadZone] Component unmounted');
  }, []);

  useEffect(() => {
    console.log('[UploadZone] State changed:', uploadState);
  }, [uploadState]);

  const validateFile = (file) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      console.error('[UploadZone] Invalid file type:', ext);
      return { valid: false, reason: `Invalid file type "${ext}". Supported: .xlsx, .xls, .csv` };
    }
    if (file.size > 25 * 1024 * 1024) {
      console.error('[UploadZone] File too large:', (file.size / 1048576).toFixed(1), 'MB');
      return { valid: false, reason: 'File too large. Maximum size: 25MB' };
    }
    return { valid: true };
  };

  const uploadFile = async (file) => {
    console.log('[UploadZone] Uploading file:', file.name, 'Size:', file.size);
    setUploadState('uploading');
    setUploadProgress(`Uploading "${file.name}"...`);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[UploadZone] Server error:', response.status, errorBody);
        throw new Error(`Server error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[UploadZone] Upload successful:', data);
      setUploadState('success');
      setUploadProgress(`"${file.name}" processed — ${data.rowCount} rows, ${data.columnCount} columns`);

      setTimeout(() => {
        onUploadSuccess?.(data);
      }, 800);
    } catch (err) {
      console.error('[UploadZone] Upload failed:', err.message);
      setUploadState('error');
      setErrorMessage(err.message);
    }
  };

  const handleFile = useCallback((file) => {
    if (!file) return;
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadState('error');
      setErrorMessage(validation.reason);
      return;
    }
    uploadFile(file);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    console.log('[UploadZone] File dropped:', file?.name);
    handleFile(file);
  }, [handleFile]);

  const handleClick = () => {
    if (uploadState === 'uploading') return;
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('[UploadZone] File selected via dialog:', file.name);
      handleFile(file);
    }
    e.target.value = '';
  };

  const resetState = () => {
    console.log('[UploadZone] Resetting upload state');
    setUploadState('idle');
    setErrorMessage('');
    setUploadProgress('');
  };

  if (hasData) return null;

  return (
    <div className="flex-1 flex items-center justify-center p-8 animate-fade-in">
      <div
        ref={dropRef}
        id="upload-dropzone"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative w-full max-w-lg cursor-pointer rounded-xl border-2 border-dashed
          transition-all duration-300 ease-out
          ${isDragging
            ? 'border-emerald-400 bg-emerald-50/40 scale-[1.01] shadow-sm'
            : uploadState === 'error'
            ? 'border-red-200 bg-red-50/30'
            : uploadState === 'success'
            ? 'border-emerald-300 bg-emerald-50/30'
            : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="file-input"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleInputChange}
        />

        <div className="flex flex-col items-center justify-center py-16 px-6">
          {/* Icon */}
          <div
            className={`
              w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-all duration-300
              ${isDragging
                ? 'bg-emerald-600 text-white scale-110'
                : uploadState === 'uploading'
                ? 'bg-emerald-50 text-emerald-600'
                : uploadState === 'error'
                ? 'bg-red-50 text-red-500'
                : uploadState === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-400'
              }
            `}
          >
            {uploadState === 'uploading' ? (
              <Loader2 size={24} className="animate-spin" />
            ) : uploadState === 'error' ? (
              <AlertCircle size={24} />
            ) : uploadState === 'success' ? (
              <CheckCircle2 size={24} />
            ) : (
              <UploadCloud size={24} />
            )}
          </div>

          {/* Content */}
          {uploadState === 'idle' && (
            <>
              <p className="text-[15px] font-semibold text-slate-700 mb-1">
                {isDragging ? 'Release to upload' : 'Drag & drop your spreadsheet'}
              </p>
              <p className="text-[13px] text-slate-400 mb-5">
                or <span className="text-emerald-600 font-medium cursor-pointer hover:underline underline-offset-2">browse files</span>
              </p>
              <div className="flex items-center gap-2.5">
                {['.xlsx', '.xls', '.csv'].map((ext) => (
                  <span key={ext} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-[11px] font-medium text-slate-500">
                    <FileSpreadsheet size={11} strokeWidth={2} />
                    {ext}
                  </span>
                ))}
              </div>
            </>
          )}

          {uploadState === 'uploading' && (
            <div className="text-center animate-fade-in">
              <p className="text-[13px] font-medium text-emerald-700 mb-3">{uploadProgress}</p>
              <div className="w-48 h-1 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full animate-pulse-soft" style={{ width: '70%' }} />
              </div>
            </div>
          )}

          {uploadState === 'success' && (
            <div className="text-center animate-slide-up">
              <p className="text-[13px] font-medium text-emerald-700">{uploadProgress}</p>
            </div>
          )}

          {uploadState === 'error' && (
            <div className="text-center animate-fade-in">
              <p className="text-[13px] font-medium text-red-600 mb-3">{errorMessage}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetState();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <X size={12} />
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
