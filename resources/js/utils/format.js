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