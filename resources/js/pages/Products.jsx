import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import { productAPI, categoryAPI } from '../services/api';
import Swal from 'sweetalert2';
import { formatCurrency, formatNumber } from '../utils/format';
import BarcodeScanner from '../components/BarcodeScanner';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [form, setForm] = useState({
        name: '', category_id: '', price: '', cost_price: '', stock: '', min_stock: '5', unit: 'pcs', description: '', image: null,
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await productAPI.index({ search, page, per_page: 10 });
            setProducts(res.data.data);
            setMeta(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [search, page]);

    const fetchCategories = async () => {
        try {
            const res = await categoryAPI.all();
            setCategories(res.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchData(); fetchCategories(); }, [fetchData]);
    useEffect(() => { setPage(1); }, [search]);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: '', category_id: '', price: '', cost_price: '', stock: '', min_stock: '5', unit: 'pcs', description: '', image: null });
        setShowModal(true);
    };

    const openEdit = (product) => {
        setEditing(product);
        setForm({
            name: product.name, category_id: product.category_id, price: product.price, cost_price: product.cost_price,
            stock: product.stock, min_stock: product.min_stock, unit: product.unit, description: product.description || '', image: null,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        Object.keys(form).forEach(key => {
            if (key === 'image' && form.image) formData.append(key, form.image);
            else if (key !== 'image') formData.append(key, form[key]);
        });
        try {
            if (editing) {
                await productAPI.update(editing.id, formData);
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Produk berhasil diupdate', timer: 1500, showConfirmButton: false });
            } else {
                await productAPI.store(formData);
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Produk berhasil ditambahkan', timer: 1500, showConfirmButton: false });
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            const msg = error.response?.data?.message || Object.values(error.response?.data?.errors || {}).flat()[0] || 'Terjadi kesalahan';
            Swal.fire({ icon: 'error', title: 'Error', text: msg });
        }
    };

    const handleDelete = (product) => {
        Swal.fire({
            title: 'Hapus Produk?', text: `Yakin ingin menghapus ${product.name}?`, icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#FF6B00', cancelButtonColor: '#6B7280',
            confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await productAPI.destroy(product.id);
                    Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Produk berhasil dihapus', timer: 1500, showConfirmButton: false });
                    fetchData();
                } catch (error) {
                    Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Gagal menghapus' });
                }
            }
        });
    };

    const columns = [
        { header: 'No', render: (_, idx) => <span className="text-gray-500">{(meta?.current_page - 1) * 10 + idx + 1}</span> },
        { header: 'Kode', render: (row) => (
            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                {row.code} {row.code && row.code !== row.name && <span className="text-green-500 ml-1" title="Barcode/QR tersimpan">#</span>}
            </span>
        )},
        { header: 'Nama', render: (row) => <span className="font-medium text-gray-900">{row.name}</span> },
        { header: 'Kategori', render: (row) => <span className="text-gray-500">{row.category?.name || '-'}</span> },
        { header: 'Harga Jual', render: (row) => <span className="font-semibold">{formatCurrency(row.price)}</span> },
        { header: 'Harga Beli', render: (row) => <span className="text-gray-600">{formatCurrency(row.cost_price)}</span> },
        { header: 'Laba', render: (row) => {
            const profit = (Number(row.price) || 0) - (Number(row.cost_price) || 0);
            const profitPercent = Number(row.cost_price) > 0 ? ((profit / Number(row.cost_price)) * 100).toFixed(1) : 0;
            return (
                <span className="text-green-600 font-medium">
                    {formatCurrency(profit)} <span className="text-xs">({profitPercent}%)</span>
                </span>
            );
        }},
        { header: 'Stok', render: (row) => (
            <span className={`font-semibold ${row.stock <= row.min_stock ? 'text-red-600' : 'text-green-600'}`}>
                {formatNumber(row.stock)} {row.unit}
                {row.stock <= row.min_stock && <span className="ml-1 text-xs">(menipis)</span>}
            </span>
        )},
        { header: 'Status', render: (row) => (
            <span className={`px-2 py-1 text-xs rounded-full ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {row.is_active ? 'Aktif' : 'Nonaktif'}
            </span>
        )},
        { header: 'Aksi', render: (row) => (
            <div className="flex gap-2">
                <button onClick={() => openEdit(row)} className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg">Edit</button>
                <button onClick={() => handleDelete(row)} className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">Hapus</button>
            </div>
        )},
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
                <button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Tambah Produk</button>
            </div>
            <DataTable columns={columns} data={products} loading={loading} search={search} onSearchChange={setSearch} meta={meta} onPageChange={setPage} />

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Produk' : 'Tambah Produk'}</h3>
                            <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 text-xs font-medium transition-colors"
                                title="Scan Barcode / QR Code"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Scan
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                        <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required>
                                            <option value="">Pilih Kategori</option>
                                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Kode Produk (Barcode/QR)</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm" placeholder="Auto-generate jika kosong" />
                                            <button
                                                type="button"
                                                onClick={() => setShowScanner(true)}
                                                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                                title="Scan Kode"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Scan atau masukkan kode barcode/QR produk</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual</label>
                                        <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required min="0" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Harga Beli</label>
                                        <input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required min="0" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
                                        <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required min="0" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Stok</label>
                                        <input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required min="0" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                                        <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                                            <option value="pcs">Pcs</option>
                                            <option value="pack">Pack</option>
                                            <option value="box">Box</option>
                                            <option value="lusin">Lusin</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gambar</label>
                                    <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] })} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" />
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Batal</button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Barcode Scanner Modal */}
            {showScanner && (
                <BarcodeScanner
                    onScan={(code) => {
                        setForm({ ...form, code: code });
                        setShowScanner(false);
                    }}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
};

export default Products;