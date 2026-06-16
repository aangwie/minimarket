import React, { useState, useEffect } from 'react';
import { dashboardAPI, stockAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, color, bgColor, suffix }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl lg:text-3xl font-bold mt-1 text-gray-900">
                    {value?.toLocaleString('id-ID')}
                    {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
                </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${bgColor}`}>
                <svg className={`w-6 h-6 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [lowStock, setLowStock] = useState(null);
    const [period, setPeriod] = useState('today');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        fetchLowStock();
    }, [period]);

    const fetchData = async () => {
        try {
            const res = await dashboardAPI.index({ period });
            setData(res.data);
        } catch (error) {
            console.error('Dashboard error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLowStock = async () => {
        try {
            const res = await stockAPI.low();
            setLowStock(res.data);
        } catch (error) {
            console.error('Low stock error:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
            </div>
        );
    }

    const stats = data?.stats || {};
    const charts = data?.charts || {};

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                    {['today', 'week', 'month', 'year'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                period === p ? 'bg-orange-500 text-white' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            {p === 'today' ? 'Hari Ini' : p === 'week' ? 'Minggu' : p === 'month' ? 'Bulan' : 'Tahun'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Penjualan" value={stats.total_sales} suffix="transaksi" icon="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" color="text-orange-600" bgColor="bg-orange-100" />
                <StatCard title="Total Pendapatan" value={stats.total_revenue} suffix="Rp" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="text-green-600" bgColor="bg-green-100" />
                <StatCard title="Produk Terjual" value={stats.total_items_sold} suffix="item" icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" color="text-blue-600" bgColor="bg-blue-100" />
                <StatCard title="Stok Menipis" value={stats.low_stock_products} suffix="produk" icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" color="text-red-600" bgColor="bg-red-100" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Pendapatan Bulanan</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={charts.revenue || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(val) => val.split('-')[2]} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => (val / 1000).toFixed(0) + 'k'} />
                            <Tooltip formatter={(value) => [`Rp ${value?.toLocaleString('id-ID')}`, 'Pendapatan']} />
                            <Bar dataKey="revenue" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Transaksi Bulanan</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={charts.sales || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(val) => val.split('-')[2]} />
                            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                            <Tooltip formatter={(value) => [value, 'Transaksi']} />
                            <Line type="monotone" dataKey="count" stroke="#FF6B00" strokeWidth={2} dot={{ r: 3, fill: '#FF6B00' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Top Products */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6 lg:col-span-2">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Produk Terlaris</h3>
                    <div className="space-y-3">
                        {(data?.top_products || []).slice(0, 5).map((product, idx) => (
                            <div key={product.id} className="flex items-center gap-3">
                                <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                    <p className="text-xs text-gray-500">Kode: {product.code}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900">{product.quantity} pcs</p>
                                    <p className="text-xs text-gray-500">Rp {product.revenue?.toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                        ))}
                        {(!data?.top_products || data.top_products.length === 0) && (
                            <p className="text-sm text-gray-500 text-center py-4">Belum ada data penjualan</p>
                        )}
                    </div>
                </div>

                {/* Low Stock */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Peringatan Stok</h3>
                    <div className="space-y-3">
                        {(lowStock?.products || []).slice(0, 5).map((product) => (
                            <div key={product.id} className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                    <p className="text-xs text-gray-500">Stok: {product.stock} / Min: {product.min_stock}</p>
                                </div>
                                <button
                                    onClick={() => navigate('/stock')}
                                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                                >
                                    Atur
                                </button>
                            </div>
                        ))}
                        {(!lowStock?.products || lowStock.products.length === 0) && (
                            <p className="text-sm text-gray-500 text-center py-4">Semua stok aman</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;