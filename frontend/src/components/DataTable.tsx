import React, { ReactNode, useMemo, useState } from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
}

export default function DataTable<T = any>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'No data available',
  isLoading = false,
}: DataTableProps<T>) {
  const { theme, mounted } = useTheme();
  const isDark = !mounted || theme === 'dark';
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filteredData = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return data;

    return data.filter((item) =>
      columns.some((column) => {
        if (column.render || column.key === 'actions') return false;
        const value = (item as Record<string, unknown>)[String(column.key)];
        if (value == null) return false;
        return String(value).toLowerCase().includes(normalizedSearch);
      }),
    );
  }, [columns, data, search]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((left, right) => {
      const leftValue = (left as Record<string, unknown>)[sortConfig.key];
      const rightValue = (right as Record<string, unknown>)[sortConfig.key];

      const normalizedLeft = typeof leftValue === 'string' ? leftValue.toLowerCase() : leftValue;
      const normalizedRight = typeof rightValue === 'string' ? rightValue.toLowerCase() : rightValue;

      if (normalizedLeft === normalizedRight) return 0;
      if (normalizedLeft == null) return 1;
      if (normalizedRight == null) return -1;

      const result = normalizedLeft > normalizedRight ? 1 : -1;
      return sortConfig.direction === 'asc' ? result : -result;
    });
  }, [filteredData, sortConfig]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [currentPage, sortedData]);

  const toggleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="panel overflow-hidden">
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0 justify-between px-4 sm:px-6 py-4 border-b"
          style={isDark
            ? { borderColor: 'rgba(30, 41, 59, 0.9)', background: 'rgba(15, 23, 42, 0.6)' }
            : { borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface-2) 72%, transparent)' }}
        >
          <div className="space-y-2">
             <div className="animate-shimmer h-4 w-20 rounded bg-[var(--skeleton-bg)]"></div>
             <div className="animate-shimmer h-3 w-32 rounded bg-[var(--skeleton-bg)]"></div>
          </div>
          <div className="animate-shimmer h-10 w-full sm:w-52 rounded-lg bg-[var(--skeleton-bg)]"></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead
              style={isDark
                ? { background: 'rgba(15, 23, 42, 0.8)' }
                : { background: 'color-mix(in srgb, var(--surface-2) 88%, transparent)' }}
            >
              <tr>
                {columns.map((column, index) => (
                  <th key={`skel-h-${index}`} className="px-4 sm:px-6 py-4 border-b border-[var(--border)]">
                    <div className="animate-shimmer h-3 w-2/3 rounded bg-[var(--skeleton-bg)]"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, rowIdx) => (
                <tr key={`skel-r-${rowIdx}`} style={{ borderBottom: '1px solid var(--border)', opacity: 1 - rowIdx * 0.15 }}>
                  {columns.map((_, colIdx) => (
                    <td key={`skel-c-${colIdx}`} className="px-4 sm:px-6 py-4">
                      <div className="animate-shimmer h-4 w-full rounded bg-[var(--skeleton-bg)]"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className="panel text-center py-14 px-4 sm:px-6">
        <div
          className={`mx-auto mb-4 h-12 w-12 rounded-2xl flex items-center justify-center font-mono text-lg ${isDark ? 'text-slate-500' : 'muted-text'}`}
          style={isDark
            ? { border: '1px solid rgba(71, 85, 105, 0.8)', background: 'rgba(15, 23, 42, 0.7)' }
            : { border: '1px solid var(--border)', background: 'color-mix(in srgb, var(--surface-2) 86%, transparent)' }}
        >
          0
        </div>
        <p className={`font-medium ${isDark ? 'text-slate-300' : 'text-[color:var(--text-primary)]'}`}>Nothing to show yet</p>
        <p className={`font-mono text-sm mt-2 ${isDark ? 'text-slate-500' : 'muted-text'}`}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0 justify-between px-4 sm:px-6 py-4 border-b"
        style={isDark
          ? { borderColor: 'rgba(30, 41, 59, 0.9)', background: 'rgba(15, 23, 42, 0.6)' }
          : { borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface-2) 72%, transparent)' }}
      >
        <div>
          <p className="section-title">Results</p>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'secondary-text'}`}>{filteredData.length} record{filteredData.length === 1 ? '' : 's'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-500' : 'muted-text'}`} />
            <input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search table"
              className="input-modern !pl-10 min-w-52"
            />
          </div>
          {sortConfig && (
            <p className={`text-xs font-mono uppercase tracking-wider ${isDark ? 'text-slate-500' : 'muted-text'}`}>
              Sorted by {sortConfig.key} ({sortConfig.direction})
            </p>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead
            className="sticky top-0 z-10"
            style={isDark
              ? { background: 'rgba(15, 23, 42, 0.8)' }
              : { background: 'color-mix(in srgb, var(--surface-2) 88%, transparent)' }}
          >
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-4 sm:px-6 py-4 text-left text-xs font-mono uppercase tracking-wider border-b ${isDark ? 'text-slate-500' : 'muted-text'}`}
                  style={isDark ? { borderColor: 'rgba(30, 41, 59, 0.9)' } : { borderColor: 'var(--border)' }}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(String(column.key))}
                      className={`flex items-center gap-2 ${isDark ? 'hover:text-slate-300' : 'hover:text-[color:var(--text-primary)]'}`}
                    >
                      {column.label}
                      <ArrowUpDown className={`w-3 h-3 ${isDark ? 'text-slate-600' : 'secondary-text'}`} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">{column.label}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={isDark ? { borderColor: 'rgba(30, 41, 59, 0.7)' } : { borderColor: 'var(--border)' }}>
            {paginatedData.map((item, rowIndex) => (
              <tr
                key={(item as any)._id || (item as any).id || rowIndex}
                onClick={() => onRowClick?.(item)}
                className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                style={isDark
                  ? {
                      background: rowIndex % 2 === 0 ? 'rgba(2, 6, 23, 0.1)' : 'rgba(15, 23, 42, 0.18)',
                      borderTop: rowIndex === 0 ? 'none' : '1px solid rgba(30, 41, 59, 0.7)',
                    }
                  : {
                      background: rowIndex % 2 === 0 ? 'transparent' : 'color-mix(in srgb, var(--surface-3) 32%, transparent)',
                      borderTop: rowIndex === 0 ? 'none' : '1px solid var(--border)',
                    }}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-slate-200' : 'text-[color:var(--text-primary)]'}`}
                  >
                    {column.render
                      ? column.render(item)
                      : String((item as any)[column.key] || '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between px-4 sm:px-6 py-4 border-t"
          style={isDark
            ? { borderColor: 'rgba(30, 41, 59, 0.9)', background: 'rgba(15, 23, 42, 0.4)' }
            : { borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface-2) 52%, transparent)' }}
        >
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'muted-text'}`}>
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>
              Previous
            </button>
            <button type="button" className="btn-secondary" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
