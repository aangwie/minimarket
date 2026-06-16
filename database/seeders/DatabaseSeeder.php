<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Customer;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        User::create([
            'name' => 'Admin',
            'email' => 'admin@minimarket.test',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        User::create([
            'name' => 'Kasir 1',
            'email' => 'kasir@minimarket.test',
            'password' => bcrypt('password'),
            'role' => 'cashier',
            'is_active' => true,
        ]);

        // Create categories
        $categories = [
            ['name' => 'Makanan Ringan', 'slug' => 'makanan-ringan', 'description' => 'Snack dan makanan ringan'],
            ['name' => 'Minuman', 'slug' => 'minuman', 'description' => 'Minuman ringan dan air mineral'],
            ['name' => 'Alat Tulis', 'slug' => 'alat-tulis', 'description' => 'Peralatan tulis kantor'],
            ['name' => 'Seragam Sekolah', 'slug' => 'seragam-sekolah', 'description' => 'Seragam dan perlengkapan sekolah'],
            ['name' => 'Perlengkapan Lainnya', 'slug' => 'perlengkapan-lainnya', 'description' => 'Keperluan siswa lainnya'],
        ];

        foreach ($categories as $cat) {
            Category::create($cat);
        }

        // Create suppliers
        $suppliers = [
            ['name' => 'PT. Indofood Sukses Makmur', 'phone' => '021-12345678', 'email' => 'indofood@example.com', 'address' => 'Jakarta'],
            ['name' => 'PT. Wings Food', 'phone' => '021-87654321', 'email' => 'wings@example.com', 'address' => 'Jakarta'],
            ['name' => 'CV. Alat Tulis Maju', 'phone' => '022-3456789', 'email' => 'atkmaju@example.com', 'address' => 'Bandung'],
            ['name' => 'PT. Seragam Indah', 'phone' => '024-5678901', 'email' => 'seragamindah@example.com', 'address' => 'Semarang'],
        ];

        foreach ($suppliers as $sup) {
            Supplier::create($sup);
        }

        // Create customers
        $customers = [
            ['name' => 'Umum', 'phone' => '-', 'email' => null, 'address' => null, 'points' => 0],
            ['name' => 'Ahmad Fauzi', 'phone' => '081234567890', 'email' => 'ahmad@example.com', 'address' => 'Jl. Merdeka No. 1', 'points' => 150],
            ['name' => 'Siti Nurhaliza', 'phone' => '081234567891', 'email' => 'siti@example.com', 'address' => 'Jl. Sudirman No. 5', 'points' => 75],
            ['name' => 'Budi Santoso', 'phone' => '081234567892', 'email' => 'budi@example.com', 'address' => 'Jl. Ahmad Yani No. 10', 'points' => 200],
        ];

        foreach ($customers as $cust) {
            Customer::create($cust);
        }

        // Create products
        $products = [
            // Makanan Ringan
            ['category_id' => 1, 'code' => 'SNK-001', 'name' => 'Chitato Sapi Panggang 68g', 'slug' => 'chitato-sapi-panggang', 'price' => 10500, 'cost_price' => 8500, 'stock' => 50, 'min_stock' => 10, 'unit' => 'pcs'],
            ['category_id' => 1, 'code' => 'SNK-002', 'name' => 'Tango Wafer Coklat 120g', 'slug' => 'tango-wafer-coklat', 'price' => 8500, 'cost_price' => 6500, 'stock' => 40, 'min_stock' => 10, 'unit' => 'pcs'],
            ['category_id' => 1, 'code' => 'SNK-003', 'name' => 'Oreo Original 133g', 'slug' => 'oreo-original', 'price' => 7500, 'cost_price' => 5500, 'stock' => 3, 'min_stock' => 10, 'unit' => 'pcs'],
            ['category_id' => 1, 'code' => 'SNK-004', 'name' => 'Good Time Choco Chip 135g', 'slug' => 'good-time-choco-chip', 'price' => 9500, 'cost_price' => 7500, 'stock' => 30, 'min_stock' => 10, 'unit' => 'pcs'],
            ['category_id' => 1, 'code' => 'SNK-005', 'name' => 'Pringles Original 110g', 'slug' => 'pringles-original', 'price' => 15000, 'cost_price' => 12000, 'stock' => 25, 'min_stock' => 5, 'unit' => 'pcs'],
            // Minuman
            ['category_id' => 2, 'code' => 'DRK-001', 'name' => 'Aqua Air Mineral 600ml', 'slug' => 'aqua-600ml', 'price' => 3500, 'cost_price' => 2500, 'stock' => 100, 'min_stock' => 20, 'unit' => 'pcs'],
            ['category_id' => 2, 'code' => 'DRK-002', 'name' => 'Coca Cola 390ml', 'slug' => 'coca-cola-390ml', 'price' => 6000, 'cost_price' => 4500, 'stock' => 60, 'min_stock' => 15, 'unit' => 'pcs'],
            ['category_id' => 2, 'code' => 'DRK-003', 'name' => 'Teh Botol Sosro 500ml', 'slug' => 'teh-botol-sosro', 'price' => 5500, 'cost_price' => 4000, 'stock' => 80, 'min_stock' => 15, 'unit' => 'pcs'],
            ['category_id' => 2, 'code' => 'DRK-004', 'name' => 'Milo UHT 200ml', 'slug' => 'milo-uht-200ml', 'price' => 7000, 'cost_price' => 5000, 'stock' => 2, 'min_stock' => 10, 'unit' => 'pcs'],
            // Alat Tulis
            ['category_id' => 3, 'code' => 'ATK-001', 'name' => 'Buku Tulis SiDU 38 Lembar', 'slug' => 'buku-tulis-sidu', 'price' => 5000, 'cost_price' => 3500, 'stock' => 200, 'min_stock' => 50, 'unit' => 'pcs'],
            ['category_id' => 3, 'code' => 'ATK-002', 'name' => 'Pulpen Standard AE7', 'slug' => 'pulpen-standard-ae7', 'price' => 3000, 'cost_price' => 2000, 'stock' => 150, 'min_stock' => 30, 'unit' => 'pcs'],
            ['category_id' => 3, 'code' => 'ATK-003', 'name' => 'Pensil 2B Faber Castell', 'slug' => 'pensil-2b-faber-castell', 'price' => 4500, 'cost_price' => 3000, 'stock' => 100, 'min_stock' => 25, 'unit' => 'pcs'],
            ['category_id' => 3, 'code' => 'ATK-004', 'name' => 'Penghapus Joyko', 'slug' => 'penghapus-joyko', 'price' => 2500, 'cost_price' => 1500, 'stock' => 120, 'min_stock' => 20, 'unit' => 'pcs'],
            ['category_id' => 3, 'code' => 'ATK-005', 'name' => 'Penggaris 30cm Butterfly', 'slug' => 'penggaris-30cm', 'price' => 3500, 'cost_price' => 2500, 'stock' => 90, 'min_stock' => 15, 'unit' => 'pcs'],
            // Seragam Sekolah
            ['category_id' => 4, 'code' => 'SER-001', 'name' => 'Seragam Putih Abu SMA', 'slug' => 'seragam-putih-abu', 'price' => 150000, 'cost_price' => 120000, 'stock' => 30, 'min_stock' => 5, 'unit' => 'pcs'],
            ['category_id' => 4, 'code' => 'SER-002', 'name' => 'Batik Seragam Sekolah', 'slug' => 'batik-seragam', 'price' => 125000, 'cost_price' => 100000, 'stock' => 25, 'min_stock' => 5, 'unit' => 'pcs'],
            ['category_id' => 4, 'code' => 'SER-003', 'name' => 'Topi Sekolah SD', 'slug' => 'topi-sekolah-sd', 'price' => 25000, 'cost_price' => 18000, 'stock' => 40, 'min_stock' => 10, 'unit' => 'pcs'],
            ['category_id' => 4, 'code' => 'SER-004', 'name' => 'Dasi Sekolah SMA', 'slug' => 'dasi-sekolah-sma', 'price' => 20000, 'cost_price' => 15000, 'stock' => 50, 'min_stock' => 10, 'unit' => 'pcs'],
            // Perlengkapan Lainnya
            ['category_id' => 5, 'code' => 'LKN-001', 'name' => 'Tas Sekolah Karakter', 'slug' => 'tas-sekolah-karakter', 'price' => 85000, 'cost_price' => 65000, 'stock' => 15, 'min_stock' => 5, 'unit' => 'pcs'],
            ['category_id' => 5, 'code' => 'LKN-002', 'name' => 'Botol Minum Tupperware', 'slug' => 'botol-minum-tupperware', 'price' => 55000, 'cost_price' => 40000, 'stock' => 20, 'min_stock' => 5, 'unit' => 'pcs'],
            ['category_id' => 5, 'code' => 'LKN-003', 'name' => 'Kalkulator Casio FX', 'slug' => 'kalkulator-casio', 'price' => 75000, 'cost_price' => 60000, 'stock' => 10, 'min_stock' => 3, 'unit' => 'pcs'],
            ['category_id' => 5, 'code' => 'LKN-004', 'name' => 'Tempat Pensil Karakter', 'slug' => 'tempat-pensil-karakter', 'price' => 15000, 'cost_price' => 10000, 'stock' => 60, 'min_stock' => 15, 'unit' => 'pcs'],
        ];

        foreach ($products as $prod) {
            Product::create($prod);
        }
    }
}