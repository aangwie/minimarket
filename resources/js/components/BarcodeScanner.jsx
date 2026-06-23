import React, { useEffect, useRef, useState } from 'react';

const BarcodeScanner = ({ onScan, onClose }) => {
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);
    const [error, setError] = useState('');
    const [scanning, setScanning] = useState(true);

    useEffect(() => {
        let mounted = true;

        const startScanner = async () => {
            try {
                const { Html5Qrcode } = await import('html5-qrcode');

                if (!mounted) return;

                const html5QrCode = new Html5Qrcode("scanner-element");
                html5QrCodeRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 150 },
                    formatsToSupport: [
                        // QR Code
                        Html5Qrcode.getFormats().QR_CODE,
                        // 1D barcodes
                        Html5Qrcode.getFormats().EAN_13,
                        Html5Qrcode.getFormats().EAN_8,
                        Html5Qrcode.getFormats().CODE_128,
                        Html5Qrcode.getFormats().CODE_39,
                        Html5Qrcode.getFormats().CODE_93,
                        Html5Qrcode.getFormats().UPC_A,
                        Html5Qrcode.getFormats().UPC_E,
                        Html5Qrcode.getFormats().CODABAR,
                        Html5Qrcode.getFormats().ITF,
                        Html5Qrcode.getFormats().DATA_MATRIX,
                        Html5Qrcode.getFormats().AZTEC,
                        Html5Qrcode.getFormats().PDF_417,
                    ],
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    async (decodedText) => {
                        if (mounted) {
                            try {
                                await onScan(decodedText.trim());
                            } catch (e) {
                                console.error('Scan handler error:', e);
                            }
                            setScanning(false);
                            await stopScanner();
                            if (onClose) onClose();
                        }
                    },
                    () => { } // ignore qr code errors, keep scanning
                );
            } catch (err) {
                console.error('Scanner error:', err);
                if (mounted) {
                    setError(err.message || 'Gagal mengakses kamera. Pastikan kamera tersedia dan izin diberikan.');
                }
            }
        };

        startScanner();

        return () => {
            mounted = false;
            stopScanner();
        };
    }, []);

    const stopScanner = async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
                await html5QrCodeRef.current.clear();
            } catch (e) {
                // ignore cleanup errors
            }
            html5QrCodeRef.current = null;
        }
    };

    const handleManualClose = () => {
        stopScanner();
        if (onClose) onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={handleManualClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Scan Barcode / QR Code</h3>
                    <button onClick={handleManualClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <div className="p-4">
                    {error ? (
                        <div className="text-center py-8">
                            <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <p className="text-sm text-red-600 mb-4">{error}</p>
                            <p className="text-xs text-gray-500 mb-3">Atau masukkan kode secara manual:</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    id="manual-code-input"
                                    placeholder="Masukkan kode barang..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.target.value.trim();
                                            if (val) {
                                                onScan(val);
                                                handleManualClose();
                                            }
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const val = document.getElementById('manual-code-input')?.value?.trim();
                                        if (val) {
                                            onScan(val);
                                            handleManualClose();
                                        }
                                    }}
                                    className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600"
                                >
                                    Cari
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-black rounded-lg overflow-hidden">
                                <div id="scanner-element" style={{ width: '100%', minHeight: '250px' }}></div>
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-3">
                                Arahkan kamera ke barcode atau QR Code produk
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;