import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { settingAPI } from '../services/api';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('admin@minimarket.test');
    const [password, setPassword] = useState('password');
    const [loading, setLoading] = useState(false);
    const [storeLogo, setStoreLogo] = useState(null);
    const [storeName, setStoreName] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await settingAPI.index();
            const data = res.data;
            if (data.store_logo) {
                setStoreLogo(`data:image/webp;base64,${data.store_logo}`);
            }
            if (data.store_name) {
                setStoreName(data.store_name);
            }
        } catch (e) {
            console.error('Failed to fetch settings:', e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Login Gagal',
                text: error.response?.data?.message || error.response?.data?.errors?.email?.[0] || 'Email atau password salah',
                confirmButtonColor: '#FF6B00',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        {storeLogo ? (
                            <img
                                src={storeLogo}
                                alt="Logo"
                                className="h-16 mx-auto mb-4 object-contain"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-white font-bold text-2xl">M</span>
                            </div>
                        )}
                        <h1 className="text-2xl font-bold text-gray-900">{storeName || 'Minimarket Sekolah'}</h1>
                        <p className="text-gray-500 mt-1">Silakan login untuk melanjutkan</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="admin@minimarket.test"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="password"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Memproses...' : 'Masuk'}
                        </button>
                    </form>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 text-center">Akun Demo:</p>
                        <div className="mt-2 space-y-1 text-xs text-gray-600">
                            <p>Admin: admin@minimarket.test / password</p>
                            <p>Kasir: kasir@minimarket.test / password</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;