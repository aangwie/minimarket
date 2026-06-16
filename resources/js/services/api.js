import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// API functions
export const authAPI = {
    login: (data) => api.post('/login', data),
    register: (data) => api.post('/register', data),
    logout: () => api.post('/logout'),
    me: () => api.get('/me'),
};

export const dashboardAPI = {
    index: (params) => api.get('/dashboard', { params }),
};

export const categoryAPI = {
    index: (params) => api.get('/categories', { params }),
    all: () => api.get('/categories/all'),
    show: (id) => api.get(`/categories/${id}`),
    store: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    destroy: (id) => api.delete(`/categories/${id}`),
};

export const productAPI = {
    index: (params) => api.get('/products', { params }),
    show: (id) => api.get(`/products/${id}`),
    store: (data) => api.post('/products', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    update: (id, data) => api.post(`/products/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { _method: 'PUT' },
    }),
    destroy: (id) => api.delete(`/products/${id}`),
    barcode: (code) => api.get(`/products/barcode/${code}`),
    updateStock: (id, data) => api.put(`/products/${id}/stock`, data),
};

export const supplierAPI = {
    index: (params) => api.get('/suppliers', { params }),
    all: () => api.get('/suppliers/all'),
    show: (id) => api.get(`/suppliers/${id}`),
    store: (data) => api.post('/suppliers', data),
    update: (id, data) => api.put(`/suppliers/${id}`, data),
    destroy: (id) => api.delete(`/suppliers/${id}`),
};

export const customerAPI = {
    index: (params) => api.get('/customers', { params }),
    all: () => api.get('/customers/all'),
    show: (id) => api.get(`/customers/${id}`),
    store: (data) => api.post('/customers', data),
    update: (id, data) => api.put(`/customers/${id}`, data),
    destroy: (id) => api.delete(`/customers/${id}`),
};

export const saleAPI = {
    index: (params) => api.get('/sales', { params }),
    show: (id) => api.get(`/sales/${id}`),
    store: (data) => api.post('/sales', data),
    today: () => api.get('/sales/today'),
    receipt: (id) => api.get(`/sales/${id}/receipt`),
};

export const settingAPI = {
    index: () => api.get('/settings'),
    update: (data) => api.post('/settings', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { _method: 'PUT' },
    }),
};

export const stockAPI = {
    movements: (params) => api.get('/stock/movements', { params }),
    in: (data) => api.post('/stock/in', data),
    out: (data) => api.post('/stock/out', data),
    low: () => api.get('/stock/low'),
};