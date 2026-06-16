import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import { saleAPI } from '../services/api';
import Swal from 'sweetalert2';
import { formatDateTime, formatDate, formatCurrency, formatNumber } from '../utils/format';

const Sales = () => {
    const [sales, setSales] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selectedSale, setSelectedSale] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await saleAPI.index({ search, page, per_page: 10 });
            setSales(res.data.data);
            setMeta(res.data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }, [search, page]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setPage(1); }, [search]);

    const viewDetail = async (sale) => {
        try {
            const res = await saleAPI.show(sale.id);
            setSelectedSale(res.data);
        } catch (e) { console.error(e); }
    };

    const printReceipt = async (sale) => {
        try {
            const res = await saleAPI.receipt(sale.id);
            const data = res.data;
            const receiptWindow = window.open('', '_blank', 'width=380,height=600');
            receiptWindow.document.write(`
                <html><head>
                    <title>Struk Pembayaran</title>
                    <style>
                        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; }
                        h2 { text-align: center; font-size: 16px; margin-bottom: 5px; }
                        .store-info { text-align: center; margin-bottom: 10px; font-size: 11px; }
                        .line { border-top: 1px dashed #000; margin: 8px 0; }
                        .item { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
                        .total { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin: 5px 0; }
                        .footer { text-align: center; margin-top: 15px; font-size: 10px; }
                    </style>
                </head><body>
                    <h2>${data.store_name}</h2>
                    <div class="store-info">${data.store_address}<br>Telp: ${data.store_phone}</div>
                    <div class="line"></div>
                    <div style="font-size: 11px;">
                        Invoice: ${data.sale.invoice_no}<br>
                        Tanggal: ${new Date(data.sale.created_at).toLocaleString('id-ID')}<br>
                        Kasir: ${data.sale.user?.name || '-'}
                        ${data.sale.customer?.name ? `<br>Pelanggan: ${data.sale.customer.name}` : ''}
                    </div>
                    <div class="line"></div>
                    ${data.sale.items.map(item => `
                        <div class="item">
                            <span>${item.product?.name || 'Produk'}</span>
                            <span>${formatCurrency(item.price * item.quantity)}</span>
                        </div>
                        <div style="font-size: 10px; color: #666; margin-bottom: 3px;">
                            ${item.quantity} x ${formatCurrency(item.price)}
                        </div>
                    `).join('')}
                    <div class="line"></div>
                    <div class="item"><span>Subtotal</span><span>${formatCurrency(data.sale.subtotal)}</span></div>
                    ${data.sale.discount > 0 ? `<div class="item"><span>Diskon</span><span>${formatCurrency(data.sale.discount)}</span></div>` : ''}
                    <div class="total"><span>TOTAL</span><span>${formatCurrency(data.sale.grand_total)}</span></div>
                    <div class="item"><span>Bayar</span><span>${formatCurrency(data.sale.paid_amount)}</span></div>
                    <div class="item"><span>Kembali</span><span>${formatCurrency(data.sale.change_amount)}</span></div>
                    <div style="text-align: center; font-size: 11px;">Metode: ${data.sale.payment_method.toUpperCase()}</div>
                    <div class="line"></div>
                    <div class="footer">Terima kasih telah berbelanja!</div>
                </body></html>
            `);
            receiptWindow.document.close();
        } catch (e) { console.error(e); }
    };

    const columns = [
        { header: 'Invoice', render: (row) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{row.invoice_no}</span> },
        { header: 'Tanggal', render: (row) => <span className="text-gray-500">{formatDate(row.created_at)}</span> },
        { header: 'Kasir', render: (row) => <span>{row.user?.name || '-'}</span> },
        { header: 'Pelanggan', render: (row) => <span>{row.customer?.name || 'Umum'}</span> },
        { header: 'Total', render: (row) => <span className="font-semibold">{formatCurrency(row.grand_total)}</span> },
        { header: 'Pembayaran', render: (row) => <span className="capitalize">{row.payment_method}</span> },
        { header: 'Status', render: (row) => (
            <span className={`px-2 py-1 text-xs rounded-full ${
                row.payment_status === 'paid' ? 'bg-green-100 text-green-700' : row.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
            }`}>{row.payment_status === 'paid' ? 'Lunas' : row.payment_status === 'partial' ? 'Sebagian' : 'Belum Bayar'}</span>
        )},
        { header: 'Aksi', render: (row) => (
            <div className="flex gap-2">
                <button onClick={() => viewDetail(row)} className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg">Detail</button>
                <button onClick={() => printReceipt(row)} className="px-3 py-1 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg">Cetak</button>
            </div>
        )},
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Riwayat Penjualan</h1>
            <DataTable columns={columns} data={sales} loading={loading} search={search} onSearchChange={setSearch} meta={meta} onPageChange={setPage} />

            {/* Detail Modal */}
            {selectedSale && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSale(null)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">Detail Penjualan</h3>
                            <button onClick={() => setSelectedSale(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-gray-500">Invoice:</span> <span className="font-semibold">{selectedSale.invoice_no}</span></div>
                                <div><span className="text-gray-500">Tanggal:</span> <span>{formatDateTime(selectedSale.created_at)}</span></div>
                                <div><span className="text-gray-500">Kasir:</span> <span>{selectedSale.user?.name || '-'}</span></div>
                                <div><span className="text-gray-500">Pelanggan:</span> <span>{selectedSale.customer?.name || 'Umum'}</span></div>
                                <div><span className="text-gray-500">Metode:</span> <span className="capitalize">{selectedSale.payment_method}</span></div>
                                <div><span className="text-gray-500">Status:</span> <span className="capitalize">{selectedSale.payment_status === 'paid' ? 'Lunas' : selectedSale.payment_status === 'partial' ? 'Sebagian' : 'Belum Bayar'}</span></div>
                            </div>
                            <div className="border-t border-gray-100 pt-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Item</h4>
                                <table className="w-full text-sm">
                                    <thead><tr className="text-left text-gray-500"><th className="pb-1">Produk</th><th className="pb-1 text-right">Qty</th><th className="pb-1 text-right">Harga</th><th className="pb-1 text-right">Subtotal</th></tr></thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {selectedSale.items?.map((item, i) => (
                                            <tr key={i}>
                                                <td className="py-2">{item.product?.name || '-'}</td>
                                                <td className="py-2 text-right">{formatNumber(item.quantity)}</td>
                                                <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                                                <td className="py-2 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="border-t border-gray-100 pt-4 space-y-1 text-sm">
                                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(selectedSale.subtotal)}</span></div>
                                {selectedSale.discount > 0 && <div className="flex justify-between"><span>Diskon</span><span>{formatCurrency(selectedSale.discount)}</span></div>}
                                <div className="flex justify-between font-bold text-base text-orange-600 pt-2 border-t"><span>Total</span><span>{formatCurrency(selectedSale.grand_total)}</span></div>
                                <div className="flex justify-between"><span>Bayar</span><span>{formatCurrency(selectedSale.paid_amount)}</span></div>
                                <div className="flex justify-between"><span>Kembali</span><span>{formatCurrency(selectedSale.change_amount)}</span></div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end">
                            <button onClick={() => setSelectedSale(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;