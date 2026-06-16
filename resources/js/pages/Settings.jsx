import React, { useState, useEffect } from 'react';
import { settingAPI } from '../services/api';
import Swal from 'sweetalert2';

const Settings = () => {
    const [form, setForm] = useState({
        store_name: '',
        store_address: '',
        store_phone: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await settingAPI.index();
            setForm({
                store_name: res.data.store_name || '',
                store_address: res.data.store_address || '',
                store_phone: res.data.store_phone || '',
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await settingAPI.update(form);
            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: res.data.message || 'Pengaturan berhasil disimpan',
                timer: 1500,
                showConfirmButton: false,
            });
            setForm({
                store_name: res.data.settings.store_name || '',
                store_address: res.data.settings.store_address || '',
                store_phone: res.data.settings.store_phone || '',
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Gagal menyimpan pengaturan',
            });
        } finally {
            setSaving(false);
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

    return (
        <div className="space-y-6 max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900">Pengaturan Toko</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Informasi Toko</h3>
                    <p className="text-sm text-gray-500 mt-1">Informasi ini akan digunakan pada struk belanja dan laporan.</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Toko</label>
                            <input
                                type="text"
                                value={form.store_name}
                                onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="Minimarket Sekolah"
                                required
                            />
                            <p className="text-xs text-gray-400 mt-1">Nama yang muncul di struk dan laporan PDF</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Toko</label>
                            <textarea
                                value={form.store_address}
                                onChange={(e) => setForm({ ...form, store_address: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="Jl. Sekolah No. 1"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Telepon</label>
                            <input
                                type="text"
                                value={form.store_phone}
                                onChange={(e) => setForm({ ...form, store_phone: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="021-12345678"
                                required
                            />
                        </div>
                    </div>
                    <div className="p-6 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    Menyimpan...
                                </span>
                            ) : 'Simpan Pengaturan'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Preview Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Pratinjau Struk</h3>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs max-w-xs mx-auto">
                    <div className="text-center">
                        <p className="font-bold text-sm">{form.store_name || 'Nama Toko'}</p>
                        <p className="text-gray-500 mt-1">{form.store_address || 'Alamat Toko'}</p>
                        <p className="text-gray-500">Telp: {form.store_phone || 'No. Telepon'}</p>
                    </div>
                    <div className="border-t border-dashed border-gray-300 my-2"></div>
                    <div className="text-center text-gray-400">- - - - - - - - - -</div>
                    <div className="border-t border-dashed border-gray-300 my-2"></div>
                    <div className="text-center text-gray-400 text-xs">Terima kasih telah berbelanja!</div>
                </div>
            </div>
        </div>
    );
};

export default Settings;