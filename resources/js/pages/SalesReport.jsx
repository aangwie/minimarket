import React, { useState, useEffect } from 'react';
import { formatCurrency, formatNumber, formatDate, formatDateTimeShort, formatRupiah } from '../utils/format';
import { saleAPI, reportAPI, productAPI } from '../services/api';

const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

const SalesReport = () => {
    const [activeTab, setActiveTab] = useState('transactions');
    const today = new Date().toISOString().split('T')[0];

    // === Tab 1: Transactions ===
    const [dateFrom, setDateFrom] = useState(today);
    const [dateTo, setDateTo] = useState(today);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

    // === Tab 2: Recap ===
    const [recapMonth, setRecapMonth] = useState(new Date().getMonth() + 1);
    const [recapYear, setRecapYear] = useState(currentYear);
    const [recapData, setRecapData] = useState(null);
    const [recapLoading, setRecapLoading] = useState(false);

    // === Tab 3: Product Sales ===
    const [prodDateFrom, setProdDateFrom] = useState(today);
    const [prodDateTo, setProdDateTo] = useState(today);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [products, setProducts] = useState([]);
    const [productData, setProductData] = useState(null);
    const [productLoading, setProductLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await productAPI.index({ per_page: 1000 });
            setProducts(res.data.data || []);
        } catch (e) { console.error(e); }
    };

    // === TAB 1: Transactions ===
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

    // === TAB 2: Recap ===
    const fetchRecap = async () => {
        setRecapLoading(true);
        try {
            const params = { year: recapYear };
            if (recapMonth) {
                params.month = recapMonth;
            }
            const res = await reportAPI.salesRecap(params);
            setRecapData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setRecapLoading(false);
        }
    };

    // === TAB 3: Product Sales ===
    const fetchProductSales = async () => {
        if (!prodDateFrom || !prodDateTo) return;
        setProductLoading(true);
        try {
            const res = await reportAPI.productSales({
                date_from: prodDateFrom,
                date_to: prodDateTo,
                product_id: selectedProductId || '',
            });
            setProductData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setProductLoading(false);
        }
    };

    const sales = data?.data || [];
    const summary = data ? {
        total_sales: data.total || 0,
        total_revenue: sales.reduce((s, r) => s + (Number(r.grand_total) || 0), 0),
        total_discount: sales.reduce((s, r) => s + (Number(r.discount) || 0), 0),
        total_items_sold: sales.reduce((s, r) => s + (r.items ? r.items.reduce((si, i) => si + (i.quantity || 0), 0) : 0), 0),
    } : null;

    const tabs = [
        { key: 'transactions', label: 'Transaksi' },
        { key: 'recap', label: 'Rekap Bulanan/Tahunan' },
        { key: 'products', label: 'Rekap Produk' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>

            {/* Tabs */}
            <div className="flex bg-white rounded-lg border border-gray-200 p-1 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                            activeTab === tab.key
                                ? 'bg-orange-500 text-white'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* === TAB 1: TRANSACTIONS === */}
            {activeTab === 'transactions' && (
                <>
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
                    </div>

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
                                                    <td className="p-3"><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{row.invoice_no}</span></td>
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
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between p-4 border-t border-gray-100">
                                        <p className="text-sm text-gray-500">Halaman {currentPage} dari {totalPages}</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => fetchReport(currentPage - 1)} disabled={currentPage <= 1} className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Sebelumnya</button>
                                            <button onClick={() => fetchReport(currentPage + 1)} disabled={currentPage >= totalPages} className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Selanjutnya</button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : data ? (
                            <div className="text-center py-12 text-gray-500">Tidak ada data penjualan untuk periode ini</div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">Silakan pilih rentang tanggal dan klik "Tampilkan"</div>
                        )}
                    </div>
                </>
            )}

            {/* === TAB 2: RECAP === */}
            {activeTab === 'recap' && (
                <>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bulan (kosongkan untuk tahunan)</label>
                                <select
                                    value={recapMonth}
                                    onChange={(e) => setRecapMonth(Number(e.target.value) || '')}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                                >
                                    <option value="">Semua Bulan</option>
                                    {months.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                                <select
                                    value={recapYear}
                                    onChange={(e) => setRecapYear(Number(e.target.value))}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={fetchRecap}
                                disabled={recapLoading}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {recapLoading ? 'Memuat...' : 'Tampilkan'}
                            </button>
                        </div>
                    </div>

                    {recapData && (
                        <>
                            {/* Summary */}
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 col-span-full">
                                    <p className="text-sm text-orange-500 font-semibold">{recapData.period_label}</p>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                    <p className="text-sm text-gray-500">Total Transaksi</p>
                                    <p className="text-xl font-bold text-gray-900 mt-1">{formatNumber(recapData.summary.total_sales)}</p>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                    <p className="text-sm text-gray-500">Pendapatan</p>
                                    <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(recapData.summary.total_revenue)}</p>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                    <p className="text-sm text-gray-500">Laba Kotor</p>
                                    <p className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(recapData.summary.total_profit)}</p>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                    <p className="text-sm text-gray-500">Diskon</p>
                                    <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(recapData.summary.total_discount)}</p>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                    <p className="text-sm text-gray-500">Item Terjual</p>
                                    <p className="text-xl font-bold text-blue-600 mt-1">{formatNumber(recapData.summary.total_items_sold)}</p>
                                </div>
                            </div>

                            {/* Daily Recap Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100">
                                    <h3 className="font-semibold text-gray-900">Rekap Harian</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 text-left text-gray-600">
                                                <th className="p-3 font-semibold">Tanggal</th>
                                                <th className="p-3 font-semibold text-right">Transaksi</th>
                                                <th className="p-3 font-semibold text-right">Item Terjual</th>
                                                <th className="p-3 font-semibold text-right">Diskon</th>
                                                <th className="p-3 font-semibold text-right">Pendapatan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {recapData.daily_recap.map((day, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="p-3 font-medium">{day.date}</td>
                                                    <td className="p-3 text-right">{formatNumber(day.total_sales)}</td>
                                                    <td className="p-3 text-right">{formatNumber(day.total_items)}</td>
                                                    <td className="p-3 text-right">{formatCurrency(day.total_discount)}</td>
                                                    <td className="p-3 text-right font-semibold text-green-600">{formatCurrency(day.total_revenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Product Recap */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100">
                                    <h3 className="font-semibold text-gray-900">Rekap Produk Terjual</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 text-left text-gray-600">
                                                <th className="p-3 font-semibold">#</th>
                                                <th className="p-3 font-semibold">Produk</th>
                                                <th className="p-3 font-semibold">Kode</th>
                                                <th className="p-3 font-semibold text-right">Terjual</th>
                                                <th className="p-3 font-semibold text-right">Pendapatan</th>
                                                <th className="p-3 font-semibold text-right">Modal</th>
                                                <th className="p-3 font-semibold text-right">Laba</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {recapData.product_recap.map((p, idx) => (
                                                <tr key={p.product_id} className="hover:bg-gray-50">
                                                    <td className="p-3 text-gray-500">{idx + 1}</td>
                                                    <td className="p-3 font-medium">{p.product_name}</td>
                                                    <td className="p-3 text-xs text-gray-500">{p.product_code}</td>
                                                    <td className="p-3 text-right font-semibold">{formatNumber(p.quantity)}</td>
                                                    <td className="p-3 text-right">{formatCurrency(p.revenue)}</td>
                                                    <td className="p-3 text-right text-gray-500">{formatCurrency(p.cost)}</td>
                                                    <td className={`p-3 text-right font-semibold ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatCurrency(p.profit)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {recapData.product_recap.length === 0 && (
                                                <tr><td colSpan={7} className="p-3 text-center text-gray-500">Belum ada data</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                    {!recapData && !recapLoading && (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                            <p className="text-gray-500">Pilih bulan/tahun dan klik "Tampilkan"</p>
                        </div>
                    )}
                </>
            )}

            {/* === TAB 3: PRODUCT SALES === */}
            {activeTab === 'products' && (
                <>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Awal</label>
                                <input
                                    type="date"
                                    value={prodDateFrom}
                                    onChange={(e) => setProdDateFrom(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
                                <input
                                    type="date"
                                    value={prodDateTo}
                                    onChange={(e) => setProdDateTo(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Filter Produk</label>
                                <select
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm min-w-[200px]"
                                >
                                    <option value="">Semua Produk</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={fetchProductSales}
                                disabled={productLoading}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {productLoading ? 'Memuat...' : 'Tampilkan'}
                            </button>
                        </div>
                    </div>

                    {productData && (
                        <>
                            {/* Product Summary */}
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                    <p className="text-sm text-gray-500">Total Item Terjual</p>
                                    <p className="text-xl font-bold text-gray-900 mt-1">{formatNumber(productData.summary.total_items)}</p>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                    <p className="text-sm text-gray-500">Pendapatan</p>
                                    <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(productData.summary.total_revenue)}</p>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                    <p className="text-sm text-gray-500">Modal</p>
                                    <p className="text-xl font-bold text-gray-600 mt-1">{formatCurrency(productData.summary.total_cost)}</p>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                    <p className="text-sm text-gray-500">Laba Kotor</p>
                                    <p className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(productData.summary.total_profit)}</p>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                    <p className="text-sm text-gray-500">Total Transaksi</p>
                                    <p className="text-xl font-bold text-blue-600 mt-1">{formatNumber(productData.summary.total_transactions)}</p>
                                </div>
                            </div>

                            {/* Product Recap Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100">
                                    <h3 className="font-semibold text-gray-900">Rekap Per Produk</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 text-left text-gray-600">
                                                <th className="p-3 font-semibold">#</th>
                                                <th className="p-3 font-semibold">Produk</th>
                                                <th className="p-3 font-semibold">Kode</th>
                                                <th className="p-3 font-semibold text-right">Terjual</th>
                                                <th className="p-3 font-semibold text-right">Transaksi</th>
                                                <th className="p-3 font-semibold text-right">Pendapatan</th>
                                                <th className="p-3 font-semibold text-right">Modal</th>
                                                <th className="p-3 font-semibold text-right">Laba</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {productData.products.map((p, idx) => (
                                                <tr key={p.product_id} className="hover:bg-gray-50">
                                                    <td className="p-3 text-gray-500">{idx + 1}</td>
                                                    <td className="p-3 font-medium">{p.product_name}</td>
                                                    <td className="p-3 text-xs text-gray-500">{p.product_code}</td>
                                                    <td className="p-3 text-right font-semibold">{formatNumber(p.quantity)}</td>
                                                    <td className="p-3 text-right">{formatNumber(p.transactions)}</td>
                                                    <td className="p-3 text-right">{formatCurrency(p.revenue)}</td>
                                                    <td className="p-3 text-right text-gray-500">{formatCurrency(p.cost)}</td>
                                                    <td className={`p-3 text-right font-semibold ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatCurrency(p.profit)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {productData.products.length === 0 && (
                                                <tr><td colSpan={8} className="p-3 text-center text-gray-500">Belum ada data</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Detail Transactions Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100">
                                    <h3 className="font-semibold text-gray-900">Detail Transaksi</h3>
                                </div>
                                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-gray-50">
                                            <tr className="text-left text-gray-600">
                                                <th className="p-3 font-semibold">Invoice</th>
                                                <th className="p-3 font-semibold">Tanggal</th>
                                                <th className="p-3 font-semibold">Pelanggan</th>
                                                <th className="p-3 font-semibold">Kasir</th>
                                                <th className="p-3 font-semibold">Produk</th>
                                                <th className="p-3 font-semibold text-right">Harga</th>
                                                <th className="p-3 font-semibold text-right">Qty</th>
                                                <th className="p-3 font-semibold text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {productData.details.map((d, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="p-3"><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{d.invoice_no}</span></td>
                                                    <td className="p-3 text-xs text-gray-500">{d.date}</td>
                                                    <td className="p-3">{d.customer}</td>
                                                    <td className="p-3">{d.cashier}</td>
                                                    <td className="p-3">{d.product_name}</td>
                                                    <td className="p-3 text-right">{formatCurrency(d.price)}</td>
                                                    <td className="p-3 text-right font-semibold">{formatNumber(d.quantity)}</td>
                                                    <td className="p-3 text-right">{formatCurrency(d.subtotal)}</td>
                                                </tr>
                                            ))}
                                            {productData.details.length === 0 && (
                                                <tr><td colSpan={8} className="p-3 text-center text-gray-500">Belum ada data</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                    {!productData && !productLoading && (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                            <p className="text-gray-500">Pilih rentang tanggal dan klik "Tampilkan"</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SalesReport;