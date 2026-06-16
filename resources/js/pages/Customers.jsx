import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import { customerAPI } from '../services/api';
import Swal from 'sweetalert2';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try { const res = await customerAPI.index({ search, page, per_page: 10 }); setCustomers(res.data.data); setMeta(res.data); }
        catch (error) { console.error(error); } finally { setLoading(false); }
    }, [search, page]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setPage(1); }, [search]);

    const openCreate = () => { setEditing(null); setForm({ name: '', phone: '', email: '', address: '' }); setShowModal(true); };
    const openEdit = (c) => { setEditing(c); setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '' }); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) { await customerAPI.update(editing.id, form); Swal.fire({ icon: 'success', title: 'Berhasil', timer: 1500, showConfirmButton: false }); }
            else { await customerAPI.store(form); Swal.fire({ icon: 'success', title: 'Berhasil', timer: 1500, showConfirmButton: false }); }
            setShowModal(false); fetchData();
        } catch (error) { Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Terjadi kesalahan' }); }
    };

    const handleDelete = (c) => {
        Swal.fire({ title: 'Hapus Pelanggan?', text: `Yakin ingin menghapus ${c.name}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#FF6B00', cancelButtonColor: '#6B7280', confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal' })
            .then(async (result) => {
                if (result.isConfirmed) {
                    try { await customerAPI.destroy(c.id); Swal.fire({ icon: 'success', title: 'Berhasil', timer: 1500, showConfirmButton: false }); fetchData(); }
                    catch (error) { Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Gagal menghapus' }); }
                }
            });
    };

    const columns = [
        { header: 'No', render: (_, idx) => <span className="text-gray-500">{((meta?.current_page || 1) - 1) * 10 + idx + 1}</span> },
        { header: 'Nama', render: (row) => <span className="font-medium text-gray-900">{row.name}</span> },
        { header: 'Telepon', render: (row) => <span className="text-gray-500">{row.phone || '-'}</span> },
        { header: 'Email', render: (row) => <span className="text-gray-500">{row.email || '-'}</span> },
        { header: 'Transaksi', render: (row) => <span className="font-semibold">{row.sales_count}</span> },
        { header: 'Poin', render: (row) => <span className="font-semibold text-orange-600">{row.points}</span> },
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
                <h1 className="text-2xl font-bold text-gray-900">Pelanggan</h1>
                <button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Tambah Pelanggan</button>
            </div>
            <DataTable columns={columns} data={customers} loading={loading} search={search} onSearchChange={setSearch} meta={meta} onPageChange={setPage} />

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100"><h3 className="text-lg font-semibold">{editing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h3></div>
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pelanggan</label>
                                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                                        <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                                    <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
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
        </div>
    );
};

export default Customers;