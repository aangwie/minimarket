<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Category;
use App\Models\SaleItem;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $period = $request->get('period', 'today');
        $now = Carbon::now();

        // Date ranges
        $dateRanges = [
            'today' => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
            'week' => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'month' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
            'year' => [$now->copy()->startOfYear(), $now->copy()->endOfYear()],
        ];

        [$startDate, $endDate] = $dateRanges[$period] ?? $dateRanges['today'];

        // Total sales
        $totalSales = Sale::whereBetween('created_at', [$startDate, $endDate])->count();

        // Total revenue
        $totalRevenue = Sale::whereBetween('created_at', [$startDate, $endDate])
            ->where('payment_status', 'paid')
            ->sum('grand_total');

        // Total products sold (quantity)
        $totalItemsSold = SaleItem::whereHas('sale', function ($q) use ($startDate, $endDate) {
            $q->whereBetween('created_at', [$startDate, $endDate]);
        })->sum('quantity');

        // Total products
        $totalProducts = Product::count();
        $activeProducts = Product::active()->count();

        // Low stock products
        $lowStockProducts = Product::lowStock()->count();

        // Out of stock products
        $outOfStockProducts = Product::outOfStock()->count();

        // Revenue chart data (daily for current month)
        $revenueChart = [];
        $daysInMonth = $now->daysInMonth;
        for ($i = 1; $i <= $daysInMonth; $i++) {
            $date = Carbon::create($now->year, $now->month, $i);
            $dailyRevenue = Sale::whereDate('created_at', $date)
                ->where('payment_status', 'paid')
                ->sum('grand_total');
            $revenueChart[] = [
                'date' => $date->format('Y-m-d'),
                'revenue' => (float) $dailyRevenue,
            ];
        }

        // Sales chart data (daily for current month)
        $salesChart = [];
        for ($i = 1; $i <= $daysInMonth; $i++) {
            $date = Carbon::create($now->year, $now->month, $i);
            $dailySales = Sale::whereDate('created_at', $date)->count();
            $salesChart[] = [
                'date' => $date->format('Y-m-d'),
                'count' => $dailySales,
            ];
        }

        // Top selling products
        $topProducts = SaleItem::selectRaw('product_id, SUM(quantity) as total_qty, SUM(subtotal) as total_revenue')
            ->whereHas('sale', function ($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate]);
            })
            ->groupBy('product_id')
            ->orderByDesc('total_qty')
            ->take(10)
            ->with('product:id,name,code,image')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->product_id,
                    'name' => $item->product->name ?? 'Deleted',
                    'code' => $item->product->code ?? '-',
                    'quantity' => (int) $item->total_qty,
                    'revenue' => (float) $item->total_revenue,
                ];
            });

        // Category distribution
        $categoryDistribution = Category::withCount(['products'])
            ->get()
            ->map(function ($cat) {
                return [
                    'name' => $cat->name,
                    'count' => $cat->products_count,
                ];
            });

        // Recent sales
        $recentSales = Sale::with(['user:id,name', 'customer:id,name'])
            ->orderByDesc('created_at')
            ->take(10)
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'invoice_no' => $sale->invoice_no,
                    'cashier' => $sale->user->name ?? '-',
                    'customer' => $sale->customer->name ?? 'Umum',
                    'grand_total' => (float) $sale->grand_total,
                    'payment_method' => $sale->payment_method,
                    'created_at' => $sale->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return response()->json([
            'stats' => [
                'total_sales' => $totalSales,
                'total_revenue' => (float) $totalRevenue,
                'total_items_sold' => $totalItemsSold,
                'total_products' => $totalProducts,
                'active_products' => $activeProducts,
                'low_stock_products' => $lowStockProducts,
                'out_of_stock_products' => $outOfStockProducts,
            ],
            'charts' => [
                'revenue' => $revenueChart,
                'sales' => $salesChart,
            ],
            'top_products' => $topProducts,
            'category_distribution' => $categoryDistribution,
            'recent_sales' => $recentSales,
        ]);
    }
}