import React, { useState, useEffect, useRef } from 'react';
import { productAPI, customerAPI, saleAPI, settingAPI } from '../services/api';
import Swal from 'sweetalert2';
import { formatCurrency, formatNumber, formatRupiah, parseRupiah } from '../utils/format';
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
    const [paidAmountDisplay, setPaidAmountDisplay] = useState('');
    const [loading, setLoading] = useState(false);
    const [showMethodPicker, setShowMethodPicker] = useState(false);
    const [savedCarts, setSavedCarts] = useState([]);
    const [showSavedCarts, setShowSavedCarts] = useState(false);
    const [showQRIS, setShowQRIS] = useState(false);
    const [qrisConfig, setQrisConfig] = useState({ type: 'upload', image: null, danaUrl: '', interactiveUrl: '' });
    const barcodeRef = useRef(null);
    const paidAmountRef = useRef(null);

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
        fetchQrisSettings();
        setTimeout(() => barcodeRef.current?.focus(), 100);
    }, []);

    useEffect(() => {
        if (!showMethodPicker && !showSavedCarts) {
            barcodeRef.current?.focus();
        }
    }, [cart, showMethodPicker, showSavedCarts]);

    // Open QRIS modal when payment method is set to qris
    useEffect(() => {
        if (showMethodPicker && paymentMethod === 'qris') {
            setShowQRIS(true);
        }
    }, [showMethodPicker, paymentMethod]);

    // Keyboard shortcut: F10 = payment, F2 = simpan cart
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F10') {
                e.preventDefault();
                if (cart.length > 0) {
                    setShowMethodPicker(true);
                    setTimeout(() => paidAmountRef.current?.focus(), 50);
                }
            }
            if (e.key === 'F2') {
                e.preventDefault();
                if (cart.length > 0) {
                    handleSaveCart();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart.length, selectedCustomer, discount]);

    const fetchProducts = async () => {
        try {
            const res = await productAPI.index({ per_page: 200 });
            setProducts(res.data.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchQrisSettings = async () => {
        try {
            const res = await settingAPI.index();
            const data = res.data;
            setQrisConfig({
                type: data.qris_type || 'upload',
                image: data.qris_image ? `data:image/webp;base64,${data.qris_image}` : null,
                danaUrl: data.qris_dana_url || '',
                interactiveUrl: data.qris_interactive_url || '',
            });
        } catch (e) {
            console.error('Failed to fetch QRIS settings:', e);
        }
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

    const handleBarcodeSubmit = async (e) => {
        e?.preventDefault();
        if (!barcode.trim()) return;
        try {
            const res = await productAPI.barcode(barcode);
            addToCart(res.data);
            setBarcode('');
            barcodeRef.current?.focus();
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Tidak Ditemukan', text: `Produk dengan kode ${barcode} tidak ditemukan` });
            setBarcode('');
            barcodeRef.current?.focus();
        }
    };

    // === KERANJANG SEMENTARA ===
    const handleSaveCart = () => {
        if (cart.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Keranjang Kosong', text: 'Tidak ada item untuk disimpan' });
            return;
        }

        // Ambil nama pelanggan yang dipilih
        const customer = customers.find(c => c.id === parseInt(selectedCustomer));

        Swal.fire({
            title: 'Simpan Keranjang',
            input: 'text',
            inputLabel: 'Nama pelanggan / keterangan',
            inputValue: customer?.name || `Pelanggan ${savedCarts.length + 1}`,
            showCancelButton: true,
            confirmButtonText: 'Simpan',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#FF6B00',
            preConfirm: (name) => {
                if (!name) {
                    Swal.showValidationMessage('Nama tidak boleh kosong');
                }
                return name;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const label = result.value || `Pelanggan ${savedCarts.length + 1}`;
                const newSaved = [...savedCarts, {
                    id: Date.now(),
                    label,
                    cart: [...cart],
                    customer_id: selectedCustomer,
                    discount,
                }];
                setSavedCarts(newSaved);
                setCart([]);
                setDiscount(0);
                setPaidAmount(0);
                setPaidAmountDisplay('');
                setShowMethodPicker(false);
                barcodeRef.current?.focus();
                Swal.fire({
                    icon: 'success',
                    title: 'Keranjang Disimpan',
                    text: `Keranjang "${label}" telah disimpan. Ada ${newSaved.length} keranjang tersimpan.`,
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        });
    };

    const handleRestoreCart = (saved) => {
        Swal.fire({
            title: 'Restore Keranjang',
            text: `Lanjutkan belanja "${saved.label}"? Keranjang saat ini akan diganti.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Restore',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#FF6B00',
        }).then((result) => {
            if (result.isConfirmed) {
                setCart(saved.cart);
                setSelectedCustomer(saved.customer_id);
                setDiscount(saved.discount);
                setPaidAmount(0);
                setPaidAmountDisplay('');
                setShowMethodPicker(false);
                setShowSavedCarts(false);
                // Hapus dari daftar tersimpan
                setSavedCarts(prev => prev.filter(s => s.id !== saved.id));
                barcodeRef.current?.focus();
            }
        });
    };

    const handleDeleteSavedCart = (id) => {
        setSavedCarts(prev => prev.filter(s => s.id !== id));
    };

    const clearCurrentCart = () => {
        if (cart.length === 0) return;
        Swal.fire({
            title: 'Hapus Keranjang?',
            text: 'Semua item di keranjang saat ini akan dihapus.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#EF4444',
        }).then((result) => {
            if (result.isConfirmed) {
                setCart([]);
                setDiscount(0);
                setPaidAmount(0);
                setPaidAmountDisplay('');
                setShowMethodPicker(false);
                barcodeRef.current?.focus();
            }
        });
    };

    // === END KERANJANG SEMENTARA ===

    const filteredProducts = products.filter(p =>
        (p.name?.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase())) &&
        p.is_active
    );

    const subtotal = cart.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
    const totalDiskon = Number(discount) || 0;
    const grandTotal = Math.max(0, subtotal - totalDiskon);
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

    const processPayment = async () => {
        if (cart.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Keranjang Kosong', text: 'Tambahkan produk terlebih dahulu' });
            return;
        }

        const amount = parseRupiah(paidAmountDisplay) || grandTotal;
        if (amount < grandTotal) {
            Swal.fire({ icon: 'warning', title: 'Pembayaran Kurang', text: `Jumlah dibayar kurang dari total Rp ${formatRupiah(grandTotal)}` });
            paidAmountRef.current?.focus();
            return;
        }

        setLoading(true);
        try {
            const payload = {
                customer_id: parseInt(selectedCustomer) || 1,
                items: cart.map(c => ({ product_id: c.product_id, quantity: c.quantity })),
                discount: totalDiskon,
                payment_method: paymentMethod,
                payment_status: 'paid',
                paid_amount: amount,
            };

            const res = await saleAPI.store(payload);
            const saleData = res.data.sale;

            // Close QRIS modal if open
            setShowQRIS(false);

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
            setPaidAmountDisplay('');
            setShowMethodPicker(false);
            fetchProducts();

            // Cek apakah ada keranjang tersimpan
            if (savedCarts.length > 0) {
                const nextCart = await Swal.fire({
                    title: 'Ada Keranjang Tersimpan',
                    text: `Terdapat ${savedCarts.length} keranjang yang belum dilanjutkan. Apakah ingin melihatnya?`,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'Lihat',
                    cancelButtonText: 'Nanti',
                    confirmButtonColor: '#FF6B00',
                });
                if (nextCart.isConfirmed) {
                    setShowSavedCarts(true);
                } else {
                    barcodeRef.current?.focus();
                }
            } else {
                barcodeRef.current?.focus();
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Transaksi gagal' });
        } finally {
            setLoading(false);
        }
    };

    const handlePaidAmountChange = (e) => {
        const raw = e.target.value;
        const numeric = parseRupiah(raw);
        setPaidAmount(numeric);
        setPaidAmountDisplay(numeric > 0 ? formatRupiah(numeric) : '');
    };

    const handlePaidAmountKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            processPayment();
        }
    };

    const handleCancelPayment = () => {
        setShowMethodPicker(false);
        setPaidAmount(0);
        setPaidAmountDisplay('');
        barcodeRef.current?.focus();
    };

    const displayAmount = parseRupiah(paidAmountDisplay);
    const displayChange = Math.max(0, displayAmount - grandTotal);

    return (
        <div className="h-[calc(100vh-7rem)] flex flex-col lg:flex-row gap-4">
            {/* Left: Products */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <form onSubmit={handleBarcodeSubmit} className="flex gap-2 mb-3">
                        <div className="relative flex-1">
                            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            <input
                                ref={barcodeRef}
                                type="text"
                                placeholder="Scan / ketik kode barang..."
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Cari
                        </button>
                    </form>
                    <div className="relative">
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari nama produk..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => { addToCart(product); barcodeRef.current?.focus(); }}
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
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Keranjang Belanja</h3>
                        <div className="flex items-center gap-2">
                            {/* Tombol Lihat Keranjang Tersimpan */}
                            {savedCarts.length > 0 && (
                                <button
                                    onClick={() => setShowSavedCarts(true)}
                                    className="relative p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                    title={`${savedCarts.length} keranjang tersimpan`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                        {savedCarts.length}
                                    </span>
                                </button>
                            )}
                            {/* Tombol Simpan Keranjang */}
                            {cart.length > 0 && (
                                <button
                                    onClick={handleSaveCart}
                                    className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                    title="Simpan keranjang (F2)"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <select
                            value={selectedCustomer}
                            onChange={(e) => setSelectedCustomer(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        >
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    {cart.length > 0 && (
                        <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">F10</kbd>
                            <span>Bayar</span>
                            <span className="text-gray-300">|</span>
                            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">F2</kbd>
                            <span>Simpan</span>
                        </div>
                    )}
                </div>

                {/* === QRIS MODAL === */}
                {showQRIS && (
                    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={() => setShowQRIS(false)}>
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 text-center">
                                <h3 className="font-semibold text-gray-900 text-lg mb-1">Scan QRIS</h3>
                                <p className="text-sm text-gray-500 mb-4">Scan QR code di bawah untuk membayar</p>

                                <div className="flex justify-center mb-4">
                                    {(qrisConfig.type === 'dana' && qrisConfig.danaUrl) ? (
                                        <div className="w-56 h-56 bg-white border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                                            <img
                                                src={`${qrisConfig.danaUrl}?amount=${grandTotal}`}
                                                alt="QRIS DANA"
                                                className="w-52 h-52 object-contain"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerHTML = `
                                                        <div class="text-center p-4">
                                                            <svg class="w-16 h-16 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                                            </svg>
                                                            <p class="text-sm text-gray-500">URL QRIS tidak valid</p>
                                                            <p class="text-xs text-gray-400 mt-1">Periksa pengaturan URL DANA</p>
                                                        </div>
                                                    `;
                                                }}
                                            />
                                        </div>
                                    ) : (qrisConfig.type === 'interactive' && qrisConfig.interactiveUrl) ? (
                                        <div className="w-56 h-56 bg-white border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                                            <img
                                                src={`${qrisConfig.interactiveUrl}?amount=${grandTotal}`}
                                                alt="QRIS Interactive"
                                                className="w-52 h-52 object-contain"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerHTML = `
                                                        <div class="text-center p-4">
                                                            <svg class="w-16 h-16 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                                            </svg>
                                                            <p class="text-sm text-gray-500">URL QRIS tidak valid</p>
                                                            <p class="text-xs text-gray-400 mt-1">Periksa pengaturan URL Interactive</p>
                                                        </div>
                                                    `;
                                                }}
                                            />
                                        </div>
                                    ) : qrisConfig.image ? (
                                        <div className="w-56 h-56 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center p-2">
                                            <img
                                                src={qrisConfig.image}
                                                alt="QRIS"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-56 h-56 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                                            <div className="text-center">
                                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                                </svg>
                                                <p className="text-sm text-gray-400">Belum ada QRIS</p>
                                                <p className="text-xs text-gray-300 mt-1">Atur di menu Pengaturan</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Total amount badge */}
                                <div className="bg-orange-50 rounded-lg p-3 mb-4">
                                    <p className="text-xs text-orange-600">Total Pembayaran</p>
                                    <p className="text-xl font-bold text-orange-700">{formatCurrency(grandTotal)}</p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setShowQRIS(false);
                                            setShowMethodPicker(true);
                                            setTimeout(() => paidAmountRef.current?.focus(), 50);
                                        }}
                                        className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
                                    >
                                        Kembali
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Set paid amount = grand total and process payment directly
                                            setPaidAmount(grandTotal);
                                            setPaidAmountDisplay(formatRupiah(grandTotal));
                                            // Small delay then process
                                            setTimeout(() => processPayment(), 100);
                                        }}
                                        disabled={loading}
                                        className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Memproses...' : 'Konfirmasi Bayar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* === MODAL SAVED CARTS === */}
                {showSavedCarts && (
                    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={() => setShowSavedCarts(false)}>
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">
                                    Keranjang Tersimpan ({savedCarts.length})
                                </h3>
                                <button onClick={() => setShowSavedCarts(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                            </div>
                            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
                                {savedCarts.length === 0 ? (
                                    <p className="text-center text-gray-400 text-sm py-8">Belum ada keranjang tersimpan</p>
                                ) : (
                                    savedCarts.map((saved) => {
                                        const totalItems = saved.cart.reduce((s, i) => s + i.quantity, 0);
                                        const totalPrice = saved.cart.reduce((s, i) => s + i.subtotal, 0);
                                        return (
                                            <div key={saved.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0 mr-2">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{saved.label}</p>
                                                        <p className="text-xs text-gray-500">{totalItems} item • {formatCurrency(totalPrice)}</p>
                                                        {saved.discount > 0 && (
                                                            <p className="text-xs text-red-500">Diskon: {formatCurrency(saved.discount)}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <button
                                                            onClick={() => handleRestoreCart(saved)}
                                                            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition-colors"
                                                        >
                                                            Lanjutkan
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSavedCart(saved.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                                            title="Hapus"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* Preview item */}
                                                <div className="mt-2 space-y-1">
                                                    {saved.cart.slice(0, 3).map(item => (
                                                        <div key={item.product_id} className="flex justify-between text-xs text-gray-500">
                                                            <span className="truncate mr-2">{item.name} x{item.quantity}</span>
                                                            <span className="flex-shrink-0">{formatCurrency(item.subtotal)}</span>
                                                        </div>
                                                    ))}
                                                    {saved.cart.length > 3 && (
                                                        <p className="text-xs text-gray-400">...dan {saved.cart.length - 3} item lainnya</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <div className="p-4 border-t border-gray-100">
                                <button
                                    onClick={() => setShowSavedCarts(false)}
                                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                                    <button onClick={() => { removeFromCart(item.product_id); barcodeRef.current?.focus(); }} className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center text-sm font-medium">-</button>
                                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                                    <button
                                        onClick={() => {
                                            addToCart({
                                                id: item.product_id,
                                                name: item.name,
                                                code: item.code,
                                                price: item.price,
                                                stock: item.stock,
                                                is_active: true,
                                            });
                                            barcodeRef.current?.focus();
                                        }}
                                        disabled={item.quantity >= item.stock}
                                        className="w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded flex items-center justify-center text-sm font-medium disabled:opacity-50"
                                    >+</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {showMethodPicker ? (
                    /* Payment mode */
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

                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Metode Pembayaran</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['cash', 'transfer', 'qris'].map(method => (
                                    method === 'qris' && !qrisConfig.image && qrisConfig.type === 'upload' ? null :
                                    <button
                                        key={method}
                                        onClick={() => setPaymentMethod(method)}
                                        className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                                            paymentMethod === method
                                                ? 'bg-orange-500 text-white border-orange-500 ring-2 ring-orange-200'
                                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {method === 'cash' ? '💰 Tunai' : method === 'transfer' ? '🏦 Transfer' : '📱 QRIS'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-600 mb-1">
                                Dibayar <span className="text-gray-400">(Enter untuk proses)</span>
                            </label>
                            <input
                                ref={paidAmountRef}
                                type="text"
                                inputMode="numeric"
                                value={paidAmountDisplay}
                                onChange={handlePaidAmountChange}
                                onKeyDown={handlePaidAmountKeyDown}
                                className="w-full px-3 py-2.5 border-2 border-orange-500 rounded-lg focus:ring-2 focus:ring-orange-500 text-lg font-bold text-right"
                                placeholder="0"
                                autoFocus
                            />
                            {displayAmount > 0 && (
                                <div className="flex items-center justify-between mt-2">
                                    <p className={`text-sm font-semibold ${displayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {displayChange >= 0 ? `Kembali: ${formatRupiah(displayChange)}` : `Kurang: ${formatRupiah(Math.abs(displayChange))}`}
                                    </p>
                                    {displayChange >= 0 && (
                                        <button
                                            onClick={processPayment}
                                            disabled={loading}
                                            className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Memproses...' : `Bayar ${formatRupiah(grandTotal)}`}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleCancelPayment}
                                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={processPayment}
                                disabled={loading || displayAmount < grandTotal}
                                className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Memproses...' : `Bayar ${formatRupiah(grandTotal)}`}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Normal mode - summary only */
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
                            {cart.length > 0 && (
                                <button
                                    onClick={clearCurrentCart}
                                    className="px-3 py-2 text-gray-500 hover:text-red-500 hover:bg-red-50 border border-gray-200 rounded-lg text-sm transition-colors"
                                    title="Hapus keranjang"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (cart.length > 0) {
                                        setShowMethodPicker(true);
                                        setTimeout(() => paidAmountRef.current?.focus(), 50);
                                    }
                                }}
                                disabled={cart.length === 0}
                                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Bayar (F10)
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default POS;