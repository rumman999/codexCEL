import { useEffect, useRef, useState } from 'react';
import { FileSpreadsheet, Rows3, Columns3, X } from 'lucide-react';

/**
 * Scrollable data table previewing an uploaded spreadsheet's rows and columns.
 */
export default function DataTable({ data = [], fileName = '', onClose }) {
  const scrollRef = useRef(null);
  const [visibleRows, setVisibleRows] = useState(50);

  useEffect(() => {
    console.log('[DataTable] Mounted with', data.length, 'rows');
    if (data.length > 0 && data[0]) {
      console.log('[DataTable] Columns:', data[0].length, '| Headers:', data[0].slice(0, 5).join(', '));
    }
    return () => console.log('[DataTable] Unmounted');
  }, []);

  useEffect(() => {
    console.log('[DataTable] Data updated:', data.length, 'total rows');
  }, [data]);

  if (!data || data.length === 0) {
    console.log('[DataTable] Empty state: No data to display');
    return (
      <div className="flex-1 flex items-center justify-center animate-fade-in">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
            <FileSpreadsheet size={20} className="text-slate-300" />
          </div>
          <p className="text-[13px] text-slate-400">No data to preview</p>
        </div>
      </div>
    );
  }

  const headers = data[0] || [];
  const rows = data.slice(1, visibleRows + 1);
  const totalRows = data.length - 1;
  const totalCols = headers.length;

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      if (visibleRows < totalRows) {
        const next = Math.min(visibleRows + 50, totalRows);
        console.log('[DataTable] Loading more rows:', visibleRows, '->', next);
        setVisibleRows(next);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <FileSpreadsheet size={13} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-800 leading-tight">{fileName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Rows3 size={10} /> {totalRows.toLocaleString()} rows
              </span>
              <span className="text-slate-200 text-[11px]">/</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Columns3 size={10} /> {totalCols} columns
              </span>
            </div>
          </div>
        </div>
        <button
          id="close-preview-btn"
          onClick={() => {
            console.log('[DataTable] Closing preview');
            onClose?.();
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50/60 transition-colors"
          title="Close preview"
        >
          <X size={16} />
        </button>
      </div>

      {/* Table */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200">
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-r border-slate-100 bg-slate-50/80 w-12">
                #
              </th>
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-r border-slate-100 bg-slate-50/80 whitespace-nowrap min-w-[120px]"
                >
                  {header || `Col ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors duration-75"
              >
                <td className="px-3 py-2 text-[11px] text-slate-400 border-r border-slate-100 bg-slate-50/30 font-mono tabular-nums">
                  {rowIdx + 1}
                </td>
                {headers.map((_, colIdx) => (
                  <td
                    key={colIdx}
                    className="px-3 py-2 text-slate-700 border-r border-slate-50 whitespace-nowrap max-w-[250px] truncate"
                  >
                    {row[colIdx] !== undefined && row[colIdx] !== null ? String(row[colIdx]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {visibleRows < totalRows && (
          <div className="flex justify-center py-4">
            <p className="text-[11px] text-slate-400">
              Showing {visibleRows.toLocaleString()} of {totalRows.toLocaleString()} rows — scroll for more
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
