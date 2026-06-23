<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ProductAnalysisController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\StockMovementController;
use App\Http\Controllers\Api\SupplierController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Public settings (store name, logo, etc. needed on login page and receipts)
Route::get('/settings', [App\Http\Controllers\Api\SettingController::class, 'index']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Categories
    Route::get('/categories/all', [CategoryController::class, 'all']);
    Route::apiResource('categories', CategoryController::class);

    // Products
    Route::get('/products/barcode/{code}', [ProductController::class, 'barcode']);
    Route::put('/products/{product}/stock', [ProductController::class, 'updateStock']);
    Route::apiResource('products', ProductController::class);

    // Suppliers
    Route::get('/suppliers/all', [SupplierController::class, 'all']);
    Route::apiResource('suppliers', SupplierController::class);

    // Customers
    Route::get('/customers/all', [CustomerController::class, 'all']);
    Route::apiResource('customers', CustomerController::class);

    // Sales / POS
    Route::get('/sales/today', [SaleController::class, 'todaySales']);
    Route::get('/sales/{sale}/receipt', [SaleController::class, 'receipt']);
    Route::apiResource('sales', SaleController::class);

    // Settings (update only needs auth)
    Route::put('/settings', [App\Http\Controllers\Api\SettingController::class, 'update']);

    // Reports
    Route::get('/reports/sales', [App\Http\Controllers\Api\ReportController::class, 'sales']);
    Route::get('/reports/sales/pdf', [App\Http\Controllers\Api\ReportController::class, 'salesPdf']);
    Route::get('/reports/sales/recap', [App\Http\Controllers\Api\ReportController::class, 'salesRecap']);
    Route::get('/reports/sales/product-sales', [App\Http\Controllers\Api\ReportController::class, 'productSales']);

    // Product Analysis
    Route::get('/products/frequently-bought/{product}', [ProductAnalysisController::class, 'frequentlyBoughtTogether']);
    Route::get('/product-analysis/products', [ProductAnalysisController::class, 'products']);
    Route::get('/product-analysis/top-categories', [ProductAnalysisController::class, 'topCategories']);

    // Stock Movements
    Route::post('/stock/in', [StockMovementController::class, 'stockIn']);
    Route::post('/stock/out', [StockMovementController::class, 'stockOut']);
    Route::get('/stock/low', [StockMovementController::class, 'lowStock']);
    Route::get('/stock/movements', [StockMovementController::class, 'index']);
});