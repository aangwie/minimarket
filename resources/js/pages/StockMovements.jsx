import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import { stockAPI } from '../services/api';

const StockMovements = () => {
    const [movements, setMovements] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { search, page, per_page: 10 };
            if (typeFilter) params.type = typeFilter;
            const res = await stockAPI.movements(params);
            setMovements(res.data.data);
            setMeta(res.data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }, [search, page, typeFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setPage(1); }, [search, typeFilter]);

    const columns = [
        { header: 'No', render: (_, idx) => <span className="text-gray-500">{(meta?.current_page - 1) * 10 + idx + 1}</span> },
        { header: 'Produk', render: (row) => <span className="font-medium text-gray-900">{row.product?.name || '-'}</span> },
        { header: 'Tipe', render: (row) => (
            <span className={`px-2 py-1 text-xs rounded-full ${row.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {row.type === 'in' ? 'Masuk' : 'Keluar'}
            </span>
        )},
        { header: 'Jumlah', render: (row) => <span className="font-semibold">{row.quantity}</span> },
        { header: 'Stok Awal', render: (row) => <span className="text-gray-500">{row.stock_before}</span> },
        { header: 'Stok Akhir', render: (row) => <span className="font-semibold">{row.stock_after}</span> },
        { header: 'Keterangan', render: (row) => <span className="text-gray-500">{row.notes || '-'}</span> },
        { header: 'User', render: (row) => <span className="text-gray-500">{row.user?.name || '-'}</span> },
        { header: 'Tanggal', render: (row) => <span className="text-gray-500 text-xs">{new Date(row.created_at).toLocaleString('id-ID')}</span> },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Riwayat Stok</h1>
                <div className="flex gap-2 bg-white rounded-lg border border-gray-200 p-1">
                    {['', 'in', 'out'].map((f) => (
                        <button key={f} onClick={() => setTypeFilter(f)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${typeFilter === f ? 'bg-orange-500 text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                            {f === '' ? 'Semua' : f === 'in' ? 'Masuk' : 'Keluar'}
                        </button>
                    ))}
                </div>
            </div>
            <DataTable columns={columns} data={movements} loading={loading} search={search} onSearchChange={setSearch} meta={meta} onPageChange={setPage} />
        </div>
    );
};

export default StockMovements;