<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function sales(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
        ]);

        $sales = Sale::with(['user:id,name', 'customer:id,name', 'items.product:id,name,code,price'])
            ->whereDate('created_at', '>=', $request->date_from)
            ->whereDate('created_at', '<=', $request->date_to)
            ->latest()
            ->get();

        $summary = [
            'total_sales' => $sales->count(),
            'total_revenue' => $sales->sum('grand_total'),
            'total_discount' => $sales->sum('discount'),
            'total_profit' => $sales->sum(function ($sale) {
                return $sale->items->sum(function ($item) {
                    return ($item->price - ($item->product->cost_price ?? 0)) * $item->quantity;
                });
            }),
            'total_items_sold' => $sales->sum(function ($sale) {
                return $sale->items->sum('quantity');
            }),
        ];

        return response()->json([
            'sales' => $sales,
            'summary' => $summary,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
        ]);
    }

    public function salesPdf(Request $request)
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
        ]);

        $sales = Sale::with(['user:id,name', 'customer:id,name', 'items.product:id,name,code,price,cost_price'])
            ->whereDate('created_at', '>=', $request->date_from)
            ->whereDate('created_at', '<=', $request->date_to)
            ->latest()
            ->get();

        $summary = [
            'total_sales' => $sales->count(),
            'total_revenue' => $sales->sum('grand_total'),
            'total_discount' => $sales->sum('discount'),
            'total_profit' => $sales->sum(function ($sale) {
                return $sale->items->sum(function ($item) {
                    return ($item->price - ($item->product->cost_price ?? 0)) * $item->quantity;
                });
            }),
            'total_items_sold' => $sales->sum(function ($sale) {
                return $sale->items->sum('quantity');
            }),
        ];

        $data = [
            'sales' => $sales,
            'summary' => $summary,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
            'store_name' => Setting::getValue('store_name', config('app.name', 'Minimarket Sekolah')),
            'generated_at' => now()->translatedFormat('d F Y H:i:s'),
        ];

        $pdf = Pdf::loadView('pdf.sales-report', $data);
        $pdf->setPaper('A4', 'landscape');

        return $pdf->download('laporan-penjualan-' . $request->date_from . '-sampai-' . $request->date_to . '.pdf');
    }

    /**
     * Rekap penjualan per bulan/tahun
     */
    public function salesRecap(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'nullable|integer|between:1,12',
            'year' => 'required|integer|min:2020|max:2099',
        ]);

        $month = $request->month;
        $year = $request->year;

        $query = Sale::query();

        if ($month) {
            $query->whereYear('created_at', $year)
                  ->whereMonth('created_at', $month);
        } else {
            $query->whereYear('created_at', $year);
        }

        $sales = $query->with(['user:id,name', 'customer:id,name', 'items.product:id,name,code,price,cost_price'])
            ->latest()
            ->get();

        // Rekap harian
        $dailyRecap = $sales->groupBy(function ($sale) {
            return $sale->created_at->format('Y-m-d');
        })->map(function ($daySales) {
            return [
                'date' => $daySales->first()->created_at->translatedFormat('d F Y'),
                'total_sales' => $daySales->count(),
                'total_revenue' => $daySales->sum('grand_total'),
                'total_discount' => $daySales->sum('discount'),
                'total_items' => $daySales->sum(function ($s) {
                    return $s->items->sum('quantity');
                }),
            ];
        })->values();

        // Rekap per produk
        $productRecap = $sales->flatMap(function ($sale) {
            return $sale->items;
        })->groupBy('product_id')->map(function ($items) {
            $first = $items->first();
            $product = $first->product;
            $qty = $items->sum('quantity');
            $revenue = $items->sum(function ($i) {
                return $i->price * $i->quantity;
            });
            $cost = $items->sum(function ($i) {
                return ($i->product->cost_price ?? 0) * $i->quantity;
            });
            return [
                'product_id' => $first->product_id,
                'product_name' => $product ? $product->name : 'Produk Dihapus',
                'product_code' => $product ? $product->code : '-',
                'quantity' => $qty,
                'revenue' => $revenue,
                'cost' => $cost,
                'profit' => $revenue - $cost,
            ];
        })->sortByDesc('quantity')->values();

        $summary = [
            'total_sales' => $sales->count(),
            'total_revenue' => $sales->sum('grand_total'),
            'total_discount' => $sales->sum('discount'),
            'total_profit' => $sales->sum(function ($sale) {
                return $sale->items->sum(function ($item) {
                    return ($item->price - ($item->product->cost_price ?? 0)) * $item->quantity;
                });
            }),
            'total_items_sold' => $sales->sum(function ($sale) {
                return $sale->items->sum('quantity');
            }),
        ];

        return response()->json([
            'summary' => $summary,
            'daily_recap' => $dailyRecap,
            'product_recap' => $productRecap,
            'month' => $month,
            'year' => $year,
            'period_label' => $month
                ? \Carbon\Carbon::create()->month($month)->translatedFormat('F') . " $year"
                : "Tahun $year",
        ]);
    }

    /**
     * Rekap penjualan per produk dengan filter produk spesifik
     */
    public function productSales(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'product_id' => 'nullable|exists:products,id',
        ]);

        $query = SaleItem::with(['sale.user:id,name', 'sale.customer:id,name', 'product:id,name,code,price,cost_price'])
            ->whereHas('sale', function ($q) use ($request) {
                $q->whereDate('created_at', '>=', $request->date_from)
                  ->whereDate('created_at', '<=', $request->date_to);
            });

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        $items = $query->latest()->get()
            ->groupBy('product_id')
            ->map(function ($group) {
                $first = $group->first();
                $product = $first->product;
                $qty = $group->sum('quantity');
                $revenue = $group->sum(function ($i) {
                    return $i->price * $i->quantity;
                });
                $cost = $group->sum(function ($i) {
                    return ($i->product->cost_price ?? 0) * $i->quantity;
                });
                return [
                    'product_id' => $first->product_id,
                    'product_name' => $product ? $product->name : 'Produk Dihapus',
                    'product_code' => $product ? $product->code : '-',
                    'quantity' => $qty,
                    'revenue' => $revenue,
                    'cost' => $cost,
                    'profit' => $revenue - $cost,
                    'transactions' => $group->count(),
                ];
            })->sortByDesc('quantity')->values();

        // Detail transaksi per produk
        $details = SaleItem::with(['sale:id,invoice_no,created_at,user_id,customer_id', 'sale.user:id,name', 'sale.customer:id,name'])
            ->whereHas('sale', function ($q) use ($request) {
                $q->whereDate('created_at', '>=', $request->date_from)
                  ->whereDate('created_at', '<=', $request->date_to);
            })
            ->when($request->filled('product_id'), function ($q) use ($request) {
                $q->where('product_id', $request->product_id);
            })
            ->latest()
            ->get()
            ->map(function ($item) {
                return [
                    'invoice_no' => $item->sale->invoice_no ?? '-',
                    'date' => $item->sale->created_at->translatedFormat('d F Y H:i'),
                    'customer' => $item->sale->customer->name ?? 'Umum',
                    'cashier' => $item->sale->user->name ?? '-',
                    'product_name' => $item->product->name ?? 'Produk Dihapus',
                    'price' => $item->price,
                    'quantity' => $item->quantity,
                    'subtotal' => $item->price * $item->quantity,
                ];
            });

        $totalSummary = [
            'total_items' => $items->sum('quantity'),
            'total_revenue' => $items->sum('revenue'),
            'total_cost' => $items->sum('cost'),
            'total_profit' => $items->sum('profit'),
            'total_transactions' => $items->sum('transactions'),
        ];

        return response()->json([
            'products' => $items,
            'details' => $details,
            'summary' => $totalSummary,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
        ]);
    }
}
