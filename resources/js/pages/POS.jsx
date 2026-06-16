import React, { useState, useEffect, useRef } from 'react';
import { productAPI, customerAPI, saleAPI } from '../services/api';
import Swal from 'sweetalert2';
import { formatCurrency, formatNumber } from '../utils/format';
import BarcodeScanner from '../components/BarcodeScanner';
import ProductImage from '../components/ProductImage';

const POS = () => {
    const [cart, setCart] = useState([]);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState('');
    const [barcode, setBarcode] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('1');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [discount, setDiscount] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await productAPI.index({ per_page: 200 });
            setProducts(res.data.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchCustomers = async () => {
        try {
            const res = await customerAPI.all();
            const sorted = [...res.data].sort((a, b) => b.id === 1 ? -1 : a.name.localeCompare(b.name));
            setCustomers(sorted);
        } catch (e) { console.error(e); }
    };

    const addToCart = (product) => {
        if (!product || !product.is_active) return;
        setCart(prev => {
            const exists = prev.find(c => c.product_id === product.id);
            if (exists) {
                if (exists.quantity >= product.stock) {
                    Swal.fire({ icon: 'warning', title: 'Stok Tidak Cukup', text: `Stok ${product.name} tersedia: ${product.stock}` });
                    return prev;
                }
                const newQty = exists.quantity + 1;
                return prev.map(c => c.product_id === product.id ? { ...c, quantity: newQty, subtotal: newQty * product.price } : c);
            }
            if (product.stock <= 0) {
                Swal.fire({ icon: 'warning', title: 'Stok Habis', text: `${product.name} sedang kosong` });
                return prev;
            }
            return [...prev, {
                product_id: product.id,
                name: product.name,
                code: product.code,
                price: Number(product.price) || 0,
                quantity: 1,
                subtotal: Number(product.price) || 0,
                stock: product.stock,
            }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => {
            const existing = prev.find(c => c.product_id === productId);
            if (!existing) return prev;
            if (existing.quantity > 1) {
                const newQty = existing.quantity - 1;
                return prev.map(c => c.product_id === productId ? { ...c, quantity: newQty, subtotal: newQty * c.price } : c);
            }
            return prev.filter(c => c.product_id !== productId);
        });
    };

    const handleBarcodeSearch = async (e) => {
        e?.preventDefault();
        if (!barcode.trim()) return;
        try {
            const res = await productAPI.barcode(barcode);
            addToCart(res.data);
            setBarcode('');
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Tidak Ditemukan', text: `Produk dengan kode ${barcode} tidak ditemukan` });
        }
    };

    const filteredProducts = products.filter(p =>
        (p.name?.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase())) &&
        p.is_active
    );

    const subtotal = cart.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
    const totalDiskon = Number(discount) || 0;
    const grandTotal = Math.max(0, subtotal - totalDiskon);
    const change = Math.max(0, (Number(paidAmount) || 0) - grandTotal);
    const cartTotalQty = cart.reduce((s, i) => s + (i.quantity || 0), 0);

    const printReceipt = async (sale) => {
        if (!sale || !sale.id) return;
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

    const handleCheckout = async () => {
        if (cart.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Keranjang Kosong', text: 'Tambahkan produk terlebih dahulu' });
            return;
        }

        const result = await Swal.fire({
            title: 'Konfirmasi Pembayaran',
            html: `
                <div style="text-align: left; font-size: 14px;">
                    <p>Subtotal: <b>${formatCurrency(subtotal)}</b></p>
                    ${totalDiskon > 0 ? `<p>Diskon: <b>${formatCurrency(totalDiskon)}</b></p>` : ''}
                    <p>Total: <b>${formatCurrency(grandTotal)}</b></p>
                    <p>Metode: <b>${paymentMethod.toUpperCase()}</b></p>
                    <p>Item: <b>${cartTotalQty} produk</b></p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#FF6B00',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Ya, Bayar',
            cancelButtonText: 'Batal',
        });

        if (!result.isConfirmed) return;

        setLoading(true);
        try {
            const payload = {
                customer_id: parseInt(selectedCustomer) || 1,
                items: cart.map(c => ({ product_id: c.product_id, quantity: c.quantity })),
                discount: totalDiskon,
                payment_method: paymentMethod,
                payment_status: (Number(paidAmount) || 0) >= grandTotal ? 'paid' : 'unpaid',
                paid_amount: Number(paidAmount) || grandTotal,
            };

            const res = await saleAPI.store(payload);
            const saleData = res.data.sale;

            // Show success with options
            const action = await Swal.fire({
                icon: 'success',
                title: 'Transaksi Berhasil!',
                html: `
                    <div style="text-align: center; font-size: 14px;">
                        <p style="margin-bottom: 5px;">Invoice: <b>${saleData.invoice_no}</b></p>
                        <p style="font-size: 12px; color: #666;">Total: ${formatCurrency(saleData.grand_total)}</p>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonColor: '#FF6B00',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Cetak Struk',
                cancelButtonText: 'Kembali',
                reverseButtons: true,
            });

            if (action.isConfirmed) {
                printReceipt(saleData);
            }

            setCart([]);
            setDiscount(0);
            setPaidAmount(0);
            fetchProducts();
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Transaksi gagal' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-7rem)] flex flex-col lg:flex-row gap-4">
            {/* Left: Products */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Cari nama produk..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                            />
                            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowScanner(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                            title="Scan Barcode / QR Code"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="hidden sm:inline">Scan</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                disabled={!product.is_active || product.stock <= 0}
                                className={`text-left p-3 rounded-xl border transition-all ${
                                    !product.is_active || product.stock <= 0
                                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                        : 'border-gray-200 hover:border-orange-300 hover:shadow-md bg-white'
                                }`}
                            >
                                <div className={`w-full h-20 rounded-lg mb-2 flex items-center justify-center overflow-hidden ${product.image ? '' : 'bg-gradient-to-br from-orange-100 to-orange-50'}`}>
                                    <ProductImage src={product.image} alt={product.name} stock={product.stock} />
                                </div>
                                <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                                <p className="text-xs font-bold text-orange-600 mt-1">{formatCurrency(product.price)}</p>
                                <p className={`text-xs ${product.stock <= product.min_stock ? 'text-red-500' : 'text-gray-400'}`}>
                                    Stok: {formatNumber(product.stock)} {product.unit}
                                </p>
                            </button>
                        ))}
                        {filteredProducts.length === 0 && (
                            <div className="col-span-full text-center py-8 text-gray-500 text-sm">Produk tidak ditemukan</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Cart */}
            <div className="w-full lg:w-96 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Keranjang Belanja</h3>
                    <div className="mt-2">
                        <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {cart.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">Belum ada item</div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1 min-w-0 mr-2">
                                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                    <p className="text-xs text-gray-500">{formatCurrency(item.price)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => removeFromCart(item.product_id)} className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center text-sm font-medium">-</button>
                                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                                    <button
                                        onClick={() => addToCart({
                                            id: item.product_id,
                                            name: item.name,
                                            code: item.code,
                                            price: item.price,
                                            stock: item.stock,
                                            is_active: true,
                                        })}
                                        disabled={item.quantity >= item.stock}
                                        className="w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded flex items-center justify-center text-sm font-medium disabled:opacity-50"
                                    >+</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 space-y-3">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-semibold">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Diskon</span>
                            <input
                                type="number"
                                value={discount}
                                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                                className="w-32 text-right px-2 py-1 text-sm border border-gray-300 rounded-lg"
                                min="0"
                            />
                        </div>
                        <div className="flex justify-between text-sm font-bold text-lg border-t border-gray-200 pt-2">
                            <span>Total</span>
                            <span className="text-orange-600">{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {['cash', 'transfer', 'qris'].map(method => (
                            <button
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                    paymentMethod === method ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {method === 'cash' ? 'Tunai' : method === 'transfer' ? 'Transfer' : 'QRIS'}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Dibayar</label>
                        <input
                            type="number"
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                            min="0"
                        />
                        {paidAmount > 0 && (
                            <p className="text-xs text-green-600 mt-1">Kembali: {formatCurrency(change)}</p>
                        )}
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || loading}
                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Memproses...' : `Bayar ${formatCurrency(grandTotal)}`}
                    </button>
                </div>
            </div>

            {/* Barcode Scanner Modal */}
            {showScanner && (
                <BarcodeScanner
                    onScan={async (code) => {
                        try {
                            const res = await productAPI.barcode(code);
                            addToCart(res.data);
                        } catch (e) {
                            Swal.fire({ icon: 'error', title: 'Tidak Ditemukan', text: `Produk dengan kode ${code} tidak ditemukan` });
                        }
                    }}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
};

export default POS;
