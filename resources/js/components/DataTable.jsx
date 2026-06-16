import React from 'react';

const DataTable = ({ columns, data, loading, onPageChange, meta, search, onSearchChange, children }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Cari data..."
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    {children}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${col.className || ''}`}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-12 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                        </svg>
                                        <span className="text-gray-500 text-sm">Memuat data...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500 text-sm">
                                    Tidak ada data
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIdx) => (
                                <tr key={row.id || rowIdx} className="hover:bg-orange-50 transition-colors">
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx} className={`px-4 py-3 text-sm ${col.className || ''}`}>
                                            {col.render ? col.render(row) : row[col.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {meta && meta.last_page > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                        Menampilkan {meta.from} - {meta.to} dari {meta.total} data
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => onPageChange(meta.current_page - 1)}
                            disabled={meta.current_page === 1}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Sebelumnya
                        </button>
                        {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                            let pageNum;
                            if (meta.last_page <= 5) {
                                pageNum = i + 1;
                            } else if (meta.current_page <= 3) {
                                pageNum = i + 1;
                            } else if (meta.current_page >= meta.last_page - 2) {
                                pageNum = meta.last_page - 4 + i;
                            } else {
                                pageNum = meta.current_page - 2 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={`px-3 py-1 text-sm border rounded-lg ${meta.current_page === pageNum ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-300 hover:bg-gray-50'}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => onPageChange(meta.current_page + 1)}
                            disabled={meta.current_page === meta.last_page}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Selanjutnya
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;