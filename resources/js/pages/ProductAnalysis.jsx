import React, { useState, useEffect, useCallback } from 'react';
import { productAnalysisAPI } from '../services/api';
import { formatCurrency } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#F97316', '#6366F1', '#14B8A6', '#E11D48'];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
                <p className="font-medium text-gray-800">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-gray-600 mt-1">
                        {entry.name}: <span className="font-semibold" style={{ color: entry.color }}>{entry.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const ProductAnalysis = () => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [analysisData, setAnalysisData] = useState(null);
    const [error, setError] = useState(null);
    const [topCategories, setTopCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    const loadProducts = useCallback(async (search = '') => {
        try {
            const res = await productAnalysisAPI.products({ search });
            setProducts(res.data.data);
        } catch (e) {
            console.error('Failed to load products:', e);
        }
    }, []);

    const loadTopCategories = useCallback(async () => {
        setCategoriesLoading(true);
        try {
            const res = await productAnalysisAPI.topCategories();
            setTopCategories(res.data.data);
        } catch (e) {
            console.error('Failed to load top categories:', e);
        } finally {
            setCategoriesLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProducts();
        loadTopCategories();
    }, [loadProducts, loadTopCategories]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadProducts(searchTerm);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm, loadProducts]);

    const analyzeProduct = async (product) => {
        setSelectedProduct(product);
        setLoading(true);
        setError(null);
        setAnalysisData(null);
        try {
            const res = await productAnalysisAPI.frequentlyBought(product.id);
            setAnalysisData(res.data.data);
        } catch (e) {
            setError('Gagal memuat data analisis. Silakan coba lagi.');
            console.error('Analysis failed:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Analisa Produk</h1>
            </div>

            {/* Info card */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="font-semibold">Analisa Produk yang Sering Dibeli Bersamaan</p>
                        <p className="text-sm text-blue-100 mt-1">
                            Pilih produk untuk melihat produk lain yang sering dibeli bersamaan oleh pelanggan berdasarkan data penjualan.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Selector */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800">Pilih Produk</h2>
                        <p className="text-sm text-gray-500 mt-1">Cari dan pilih produk untuk dianalisis</p>
                    </div>
                    <div className="p-4">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Cari produk..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto border-t border-gray-100">
                        {products.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">Tidak ada produk ditemukan</p>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {products.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => analyzeProduct(product)}
                                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                                            selectedProduct?.id === product.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                        }`}
                                    >
                                        <p className="font-medium text-gray-800">{product.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {product.code} &middot; {product.category} &middot; {formatCurrency(product.price)}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Analysis Results */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800">Hasil Analisa</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {selectedProduct
                                ? `Produk yang sering dibeli dengan "${selectedProduct.name}"`
                                : 'Pilih produk terlebih dahulu'}
                        </p>
                    </div>
                    <div className="p-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <svg className="animate-spin h-8 w-8 text-blue-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                <p className="text-gray-500">Menganalisa data penjualan...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-red-500">{error}</p>
                            </div>
                        ) : analysisData ? (
                            analysisData.related_products.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    <p className="text-gray-500 font-medium">Belum Ada Data</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Produk "{analysisData.product.name}" belum memiliki data pembelian bersamaan.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {/* Summary */}
                                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-blue-700">Total Transaksi dengan produk ini:</span>
                                            <span className="font-bold text-blue-800">{analysisData.total_sales_with_product} transaksi</span>
                                        </div>
                                    </div>

                                    {/* Related Products List */}
                                    <div className="space-y-2">
                                        {analysisData.related_products.map((item, index) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-800 truncate">{item.name}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {item.category} &middot; {item.stock} {item.unit}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0 ml-3">
                                                    <p className="font-semibold text-blue-600">{item.percentage}%</p>
                                                    <p className="text-xs text-gray-500">{item.frequency}x dibeli</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Progress bars */}
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-sm font-medium text-gray-600 mb-3">Persentase Pembelian Bersamaan</p>
                                        <div className="space-y-2.5">
                                            {analysisData.related_products.slice(0, 10).map((item) => (
                                                <div key={item.id} className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-600 w-24 truncate text-right" title={item.name}>
                                                        {item.name}
                                                    </span>
                                                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-600 w-10 text-right">
                                                        {item.percentage}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="text-center py-16">
                                <svg className="w-20 h-20 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <p className="text-gray-400">Pilih produk dari daftar di samping untuk melihat analisa</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Categories Chart Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Grafik Kategori Produk Terlaris</h2>
                    <p className="text-sm text-gray-500 mt-1">Kategori produk dengan total penjualan tertinggi</p>
                </div>
                <div className="p-4">
                    {categoriesLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                        </div>
                    ) : topCategories.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>Belum ada data penjualan kategori</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Bar Chart */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-600 mb-3">Total Item Terjual per Kategori</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={topCategories}
                                            layout="vertical"
                                            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis type="number" tick={{ fontSize: 12 }} />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                tick={{ fontSize: 11 }}
                                                width={100}
                                                tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="total_items" name="Total Terjual" radius={[0, 4, 4, 0]}>
                                                {topCategories.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Pie Chart */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-600 mb-3">Distribusi Penjualan per Kategori (%)</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={topCategories}
                                                cx="50%"
                                                cy="45%"
                                                innerRadius={50}
                                                outerRadius={90}
                                                paddingAngle={3}
                                                dataKey="percentage"
                                                nameKey="name"
                                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                                labelLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                                            >
                                                {topCategories.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend
                                                layout="vertical"
                                                align="right"
                                                verticalAlign="middle"
                                                iconType="circle"
                                                iconSize={8}
                                                formatter={(value) => (
                                                    <span className="text-xs text-gray-600">{value}</span>
                                                )}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductAnalysis;