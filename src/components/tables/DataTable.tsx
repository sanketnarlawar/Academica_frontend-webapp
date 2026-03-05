import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (row: T) => ReactNode;
    sortable?: boolean;
    width?: string;
}

interface DataTableProps<T extends { id: string }> {
    data: T[];
    columns: Column<T>[];
    searchable?: boolean;
    searchPlaceholder?: string;
    pageSize?: number;
    actions?: (row: T) => ReactNode;
    emptyMessage?: string;
}

export default function DataTable<T extends { id: string }>({
    data,
    columns,
    searchable = true,
    searchPlaceholder = 'Search...',
    pageSize = 8,
    actions,
    emptyMessage = 'No data found'
}: DataTableProps<T>) {
    type RowRecord = Record<string, unknown>;

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    // Filtering
    const filtered = data.filter(row =>
        Object.values(row as object).some(val =>
            String(val).toLowerCase().includes(search.toLowerCase())
        )
    );

    // Sorting
    const sorted = sortKey
        ? [...filtered].sort((a, b) => {
            const aVal = String((a as RowRecord)[sortKey] ?? '');
            const bVal = String((b as RowRecord)[sortKey] ?? '');
            return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        })
        : filtered;

    // Pagination
    const totalPages = Math.ceil(sorted.length / pageSize);
    const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

    const handleSort = (key: string) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const getValue = (row: T, key: string) => {
        return key.split('.').reduce<unknown>((obj, k) => {
            if (obj && typeof obj === 'object') {
                return (obj as RowRecord)[k];
            }
            return undefined;
        }, row as unknown);
    };

    return (
        <div className="space-y-4">
            {searchable && (
                <div className="relative max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="input-field pl-9"
                    />
                </div>
            )}

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={String(col.key)}
                                    style={col.width ? { width: col.width } : undefined}
                                    className={col.sortable ? 'cursor-pointer hover:text-white select-none' : ''}
                                    onClick={() => col.sortable && handleSort(String(col.key))}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.header}
                                        {col.sortable && sortKey === String(col.key) && (
                                            sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actions && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center text-slate-500 py-12">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginated.map(row => (
                                <tr key={row.id}>
                                    {columns.map(col => (
                                        <td key={String(col.key)}>
                                            {col.render ? col.render(row) : String(getValue(row, String(col.key)) ?? '-')}
                                        </td>
                                    ))}
                                    {actions && <td>{actions(row)}</td>}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length} entries</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1.5 rounded-lg hover:bg-white/8 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === pageNum ? 'bg-violet-600 text-white' : 'hover:bg-white/8'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-1.5 rounded-lg hover:bg-white/8 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
