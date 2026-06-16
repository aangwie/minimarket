import React, { useState } from 'react';
import { formatCurrency, formatNumber, formatDate, formatDateTimeShort } from '../utils/format';
import { saleAPI } from '../services/api';

const SalesReport = () => {
    const today = new Date().toISOString().split('T')[0];
    const [dateFrom, setDateFrom] = useState(today);
    const [dateTo, setDateTo] = useState(today);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    const fetchReport = async (page = 1) => {
        if (!dateFrom || !dateTo) return;
        setLoading(true);
        try {
            const res = await saleAPI.index({
                date_from: dateFrom,
                date_to: dateTo,
                per_page: perPage,
                page: page,
            });
            setData(res.data);
            setTotalPages(Math.ceil((res.data.total || 0) / perPage) || 1);
            setCurrentPage(page);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const downloadPdf = () => {
        if (!dateFrom || !dateTo) return;
        const token = localStorage.getItem('token');
        const url = `/api/reports/sales/pdf?date_from=${dateFrom}&date_to=${dateTo}`;
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', '');
        link.style.display = 'none';
        
        // Add auth header via fetch and download blob
        fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/pdf',
            },
        })
        .then(response => {
            if (!response.ok) throw new Error('Gagal download');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `laporan-penjualan-${dateFrom}-sampai-${dateTo}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        })
        .catch(e => {
            console.error(e);
            alert('Gagal mengunduh PDF');
        });
    };

    const sales = data?.data || [];
    const summary = data ? {
        total_sales: data.total || 0,
        total_revenue: sales.reduce((s, r) => s + (Number(r.grand_total) || 0), 0),
        total_discount: sales.reduce((s, r) => s + (Number(r.discount) || 0), 0),
        total_items_sold: sales.reduce((s, r) => s + (r.items ? r.items.reduce((si, i) => si + (i.quantity || 0), 0) : 0), 0),
    } : null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
                <button
                    onClick={downloadPdf}
                    disabled={!data || sales.length === 0}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Cetak PDF
                </button>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Awal</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        />
                    </div>
                    <button
                        onClick={() => fetchReport(1)}
                        disabled={loading}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Memuat...' : 'Tampilkan'}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && sales.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <p className="text-sm text-gray-500">Total Transaksi</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(summary.total_sales)}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <p className="text-sm text-gray-500">Total Pendapatan</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(summary.total_revenue)}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <p className="text-sm text-gray-500">Total Diskon</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(summary.total_discount)}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <p className="text-sm text-gray-500">Item Terjual</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{formatNumber(summary.total_items_sold)}</p>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                    </div>
                ) : sales.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-left text-gray-600">
                                        <th className="p-3 font-semibold">No</th>
                                        <th className="p-3 font-semibold">Invoice</th>
                                        <th className="p-3 font-semibold">Tanggal</th>
                                        <th className="p-3 font-semibold">Kasir</th>
                                        <th className="p-3 font-semibold">Pelanggan</th>
                                        <th className="p-3 font-semibold">Item</th>
                                        <th className="p-3 font-semibold text-right">Subtotal</th>
                                        <th className="p-3 font-semibold text-right">Diskon</th>
                                        <th className="p-3 font-semibold text-right">Total</th>
                                        <th className="p-3 font-semibold text-right">Bayar</th>
                                        <th className="p-3 font-semibold">Metode</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sales.map((row, idx) => (
                                        <tr key={row.id} className="hover:bg-gray-50">
                                            <td className="p-3 text-gray-500">{(currentPage - 1) * perPage + idx + 1}</td>
                                            <td className="p-3 font-mono text-xs bg-gray-100 px-2 py-1 rounded inline-block mt-2">{row.invoice_no}</td>
                                            <td className="p-3 text-gray-500 text-xs">{formatDateTimeShort(row.created_at)}</td>
                                            <td className="p-3">{row.user?.name || '-'}</td>
                                            <td className="p-3">{row.customer?.name || 'Umum'}</td>
                                            <td className="p-3 text-center font-semibold">
                                                {row.items ? row.items.reduce((s, i) => s + (i.quantity || 0), 0) : '-'}
                                            </td>
                                            <td className="p-3 text-right">{formatCurrency(row.subtotal)}</td>
                                            <td className="p-3 text-right">{row.discount > 0 ? formatCurrency(row.discount) : '-'}</td>
                                            <td className="p-3 text-right font-semibold">{formatCurrency(row.grand_total)}</td>
                                            <td className="p-3 text-right">{formatCurrency(row.paid_amount)}</td>
                                            <td className="p-3 capitalize">{row.payment_method}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between p-4 border-t border-gray-100">
                                <p className="text-sm text-gray-500">
                                    Halaman {currentPage} dari {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fetchReport(currentPage - 1)}
                                        disabled={currentPage <= 1}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        onClick={() => fetchReport(currentPage + 1)}
                                        disabled={currentPage >= totalPages}
                                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : data ? (
                    <div className="text-center py-12 text-gray-500">Silakan pilih rentang tanggal dan klik "Tampilkan"</div>
                ) : (
                    <div className="text-center py-12 text-gray-500">Silakan pilih rentang tanggal dan klik "Tampilkan"</div>
                )}
            </div>
        </div>
    );
};

export default SalesReport;