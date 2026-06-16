import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import { productAPI, stockAPI } from '../services/api';
import Swal from 'sweetalert2';

const Stock = () => {
    const [products, setProducts] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [showStockIn, setShowStockIn] = useState(false);
    const [showStockOut, setShowStockOut] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { search, page, per_page: 10 };
            if (filter === 'low') params.stock_status = 'low';
            else if (filter === 'out') params.stock_status = 'out';
            const res = await productAPI.index(params);
            setProducts(res.data.data);
            setMeta(res.data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }, [search, page, filter]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setPage(1); }, [search, filter]);

    const openStockIn = (product) => { setSelectedProduct(product); setQuantity(1); setNotes(''); setShowStockIn(true); };
    const openStockOut = (product) => { setSelectedProduct(product); setQuantity(1); setNotes(''); setShowStockOut(true); };

    const handleStockIn = async (e) => {
        e.preventDefault();
        try {
            await stockAPI.in({ product_id: selectedProduct.id, quantity, notes });
            Swal.fire({ icon: 'success', title: 'Stok Masuk', text: `${quantity} ${selectedProduct.unit} ${selectedProduct.name}`, timer: 1500, showConfirmButton: false });
            setShowStockIn(false);
            fetchData();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Gagal' });
        }
    };

    const handleStockOut = async (e) => {
        e.preventDefault();
        try {
            await stockAPI.out({ product_id: selectedProduct.id, quantity, notes });
            Swal.fire({ icon: 'success', title: 'Stok Keluar', text: `${quantity} ${selectedProduct.unit} ${selectedProduct.name}`, timer: 1500, showConfirmButton: false });
            setShowStockOut(false);
            fetchData();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Gagal' });
        }
    };

    const columns = [
        { header: 'Kode', render: (row) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{row.code}</span> },
        { header: 'Nama', render: (row) => <span className="font-medium text-gray-900">{row.name}</span> },
        { header: 'Kategori', render: (row) => <span className="text-gray-500">{row.category?.name || '-'}</span> },
        { header: 'Stok', render: (row) => (
            <span className={`font-bold ${row.stock <= 0 ? 'text-red-600' : row.stock <= row.min_stock ? 'text-orange-500' : 'text-green-600'}`}>
                {row.stock} {row.unit}
            </span>
        )},
        { header: 'Min Stok', render: (row) => <span className="text-gray-500">{row.min_stock}</span> },
        { header: 'Status', render: (row) => (
            <span className={`px-2 py-1 text-xs rounded-full ${
                row.stock <= 0 ? 'bg-red-100 text-red-700' : row.stock <= row.min_stock ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
            }`}>
                {row.stock <= 0 ? 'Stok Habis' : row.stock <= row.min_stock ? 'Menipis' : 'Aman'}
            </span>
        )},
        { header: 'Aksi', render: (row) => (
            <div className="flex gap-2">
                <button onClick={() => openStockIn(row)} className="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg">+ Masuk</button>
                <button onClick={() => openStockOut(row)} className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">- Keluar</button>
            </div>
        )},
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Manajemen Stok</h1>
                <div className="flex gap-2 bg-white rounded-lg border border-gray-200 p-1">
                    {['', 'low', 'out'].map((f) => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === f ? 'bg-orange-500 text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                            {f === '' ? 'Semua' : f === 'low' ? 'Menipis' : 'Habis'}
                        </button>
                    ))}
                </div>
            </div>

            <DataTable columns={columns} data={products} loading={loading} search={search} onSearchChange={setSearch} meta={meta} onPageChange={setPage} />

            {/* Stock In Modal */}
            {showStockIn && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowStockIn(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100"><h3 className="text-lg font-semibold">Stok Masuk</h3></div>
                        <form onSubmit={handleStockIn}>
                            <div className="p-6 space-y-4">
                                <p className="text-sm font-medium text-gray-900">{selectedProduct?.name} (Stok: {selectedProduct?.stock} {selectedProduct?.unit})</p>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                                    <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required min="1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                                    <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Contoh: Restock dari supplier" />
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowStockIn(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">Batal</button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg">Proses Masuk</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stock Out Modal */}
            {showStockOut && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowStockOut(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100"><h3 className="text-lg font-semibold">Stok Keluar</h3></div>
                        <form onSubmit={handleStockOut}>
                            <div className="p-6 space-y-4">
                                <p className="text-sm font-medium text-gray-900">{selectedProduct?.name} (Stok: {selectedProduct?.stock} {selectedProduct?.unit})</p>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                                    <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required min="1" max={selectedProduct?.stock} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                                    <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Contoh: Rusak, expired" />
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowStockOut(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg">Batal</button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg">Proses Keluar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stock;