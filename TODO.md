# 🏪 Minimarket Sekolah - Aplikasi POS & Manajemen Stok

## 📋 Daftar Tugas Pengembangan

### Fase 1: Persiapan & Konfigurasi Awal ✅
- [x] Setup database MySQL (.env config)
- [x] Install dependencies Laravel (sanctum, API setup)
- [x] Setup React + Vite + Tailwind CSS + Frontend packages
- [x] Install frontend packages (react-router-dom, axios, sweetalert2, recharts)
- [x] Konfigurasi CORS, API routes

### Fase 2: Database & Models ✅
- [x] Buat migration: categories, products, suppliers, customers
- [x] Buat migration: sales, sale_items (detail penjualan)
- [x] Buat migration: stock_movements
- [x] Buat Model dengan Relationships & Eager Loading
- [x] Buat Model Scopes & Accessors

### Fase 3: Backend - API Controllers ✅
- [x] Buat Auth Controller (login/logout/register)
- [x] Buat Dashboard Controller (statistik data)
- [x] Buat Category Controller (CRUD)
- [x] Buat Product Controller (CRUD + search + barcode)
- [x] Buat Supplier Controller (CRUD)
- [x] Buat Customer Controller (CRUD)
- [x] Buat Sale/POS Controller (transaksi + receipt)
- [x] Buat Stock Controller (manajemen stok in/out/low stock)

### Fase 4: Frontend - Setup & Auth ✅
- [x] Setup Router React (react-router-dom)
- [x] Buat Layout & Sidebar Navigation (Responsive)
- [x] Buat Halaman Login
- [x] Buat Protected Routes
- [x] Setup Axios Interceptor

### Fase 5: Frontend - Dashboard ✅
- [x] Buat Dashboard Page (statistik card + charts)
- [x] Chart penjualan (BarChart + LineChart - Recharts)
- [x] Tabel produk terlaris
- [x] Notifikasi stok menipis

### Fase 6: Frontend - Master Data ✅
- [x] CRUD Categories (DataTable + SweetAlert2)
- [x] CRUD Products (DataTable + upload gambar)
- [x] CRUD Suppliers (DataTable)
- [x] CRUD Customers (DataTable)

### Fase 7: Frontend - POS (Point of Sale) ✅
- [x] Buat halaman POS (kasir) + keranjang + checkout
- [x] Search produk + scan barcode
- [x] Proses checkout + cetak struk
- [x] History transaksi

### Fase 8: Frontend - Manajemen Stok ✅
- [x] Halaman stok masuk/keluar
- [x] Peringatan stok minimum
- [x] History stok

### Fase 9: Database Seed ✅
- [x] Seed data: users (admin + kasir)
- [x] Seed data: 5 categories + 22 products
- [x] Seed data: suppliers + customers

### Fase 10: Build & Testing
- [ ] Build frontend (npm run build)
- [ ] Testing fitur CRUD
- [ ] Testing POS transaksi
- [ ] Responsive testing
- [ ] Final deployment

## 🗄️ Struktur Database

### Tables:
1. **users** - (default Laravel + role, is_active)
2. **categories** - id, name, slug, description
3. **products** - id, category_id, code, name, slug, description, price, cost_price, stock, min_stock, unit, image, is_active
4. **suppliers** - id, name, phone, email, address
5. **customers** - id, name, phone, email, address, points
6. **sales** - id, user_id, customer_id, invoice_no, subtotal, discount, tax, grand_total, paid_amount, change_amount, payment_method, payment_status, notes
7. **sale_items** - id, sale_id, product_id, quantity, price, subtotal
8. **stock_movements** - id, product_id, user_id, type (in/out), quantity, stock_before, stock_after, reference_type, reference_id, notes

## 🎨 Tema & Desain
- **Primary Color:** #FF6B00 (Orange)
- **Secondary Color:** #FFFFFF (White)
- **Accent:** #FF8C38 (Light Orange)
- **Dark:** #1F2937 (Dark Gray for text)
- **Font:** Inter / system-ui
- **Framework UI:** Tailwind CSS 4