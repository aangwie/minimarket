import React, { useState, useEffect, useRef } from 'react';
import { settingAPI } from '../services/api';
import Swal from 'sweetalert2';

const LOGO_DEFAULT = null;

const Settings = () => {
    const [form, setForm] = useState({
        store_name: '',
        store_address: '',
        store_phone: '',
        store_logo: null,
    });
    const [logoPreview, setLogoPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await settingAPI.index();
            const data = res.data;
            setForm({
                store_name: data.store_name || '',
                store_address: data.store_address || '',
                store_phone: data.store_phone || '',
                store_logo: null,
            });
            if (data.store_logo) {
                setLogoPreview(`data:image/webp;base64,${data.store_logo}`);
            } else {
                setLogoPreview(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Client-side validation: max 500KB
        if (file.size > 512 * 1024) {
            Swal.fire({
                icon: 'error',
                title: 'Ukuran Terlalu Besar',
                text: 'Logo maksimal 500KB. Pilih gambar yang lebih kecil.',
                confirmButtonColor: '#FF6B00',
            });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        // Validate image type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            Swal.fire({
                icon: 'error',
                title: 'Format Tidak Didukung',
                text: 'Format gambar harus JPG, PNG, GIF, atau WebP.',
                confirmButtonColor: '#FF6B00',
            });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        setForm({ ...form, store_logo: file });
        setLogoPreview(URL.createObjectURL(file));
    };

    const removeLogo = () => {
        setForm({ ...form, store_logo: null });
        setLogoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('store_name', form.store_name);
            formData.append('store_address', form.store_address);
            formData.append('store_phone', form.store_phone);
            if (form.store_logo) {
                formData.append('store_logo', form.store_logo);
            }

            const res = await settingAPI.update(formData);
            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: res.data.message || 'Pengaturan berhasil disimpan',
                timer: 1500,
                showConfirmButton: false,
            });
            // Update form with returned settings
            const settings = res.data.settings;
            setForm({
                store_name: settings.store_name || '',
                store_address: settings.store_address || '',
                store_phone: settings.store_phone || '',
                store_logo: null,
            });
            if (settings.store_logo) {
                setLogoPreview(`data:image/webp;base64,${settings.store_logo}`);
            } else {
                setLogoPreview(null);
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || error.response?.data?.errors?.store_logo?.[0] || 'Gagal menyimpan pengaturan';
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errMsg,
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
                    <p className="text-sm text-gray-500 mt-1">Informasi ini akan digunakan pada struk belanja, laporan, dan tampilan aplikasi.</p>
                </div>
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    <div className="p-6 space-y-5">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo Toko</label>
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    {logoPreview ? (
                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-white">
                                            <img
                                                src={logoPreview}
                                                alt="Logo Toko"
                                                className="w-full h-full object-contain p-1"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeLogo}
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                                title="Hapus logo"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 bg-orange-100 rounded-xl flex items-center justify-center border-2 border-dashed border-orange-300">
                                            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        onChange={handleLogoChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 cursor-pointer"
                                    />
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        Format: JPG, PNG, GIF, WebP. Maksimal 500KB. Akan dikonversi ke WebP secara otomatis.
                                    </p>
                                </div>
                            </div>
                        </div>

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
                        {logoPreview && (
                            <img src={logoPreview} alt="Logo" className="h-10 mx-auto mb-2 object-contain" />
                        )}
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