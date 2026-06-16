<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
}