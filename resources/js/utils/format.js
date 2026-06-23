export const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

export const formatDateTimeShort = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const formatTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'Rp 0';
    return `Rp ${Number(value).toLocaleString('id-ID')}`;
};

export const formatNumber = (value) => {
    if (value === null || value === undefined) return '0';
    return Number(value).toLocaleString('id-ID');
};

// Format angka ke format rupiah tanpa Rp (contoh: 20000 -> "20.000")
export const formatRupiah = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return Math.floor(Number(value)).toLocaleString('id-ID');
};

// Parse string format rupiah ke number (contoh: "20.000" -> 20000)
export const parseRupiah = (value) => {
    if (!value) return 0;
    // Hapus semua karakter non-digit
    const clean = String(value).replace(/[^0-9]/g, '');
    return parseInt(clean, 10) || 0;
};
