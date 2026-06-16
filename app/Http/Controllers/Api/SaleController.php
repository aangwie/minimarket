<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Setting;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Sale::with(['user:id,name', 'customer:id,name', 'items.product:id,name,code']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_no', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = $request->get('per_page', 10);
        $sales = $query->latest()->paginate($perPage);

        return response()->json($sales);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'discount' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:cash,transfer,qris',
            'payment_status' => 'required|in:paid,unpaid,partial',
            'paid_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request) {
            $user = $request->user();

            // Generate invoice no
            $invoiceNo = 'INV-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

            $subtotal = 0;
            $items = [];

            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);

                if ($product->stock < $item['quantity']) {
                    return response()->json([
                        'message' => "Stok {$product->name} tidak mencukupi. Stok tersedia: {$product->stock}",
                    ], 422);
                }

                $lineSubtotal = $product->price * $item['quantity'];
                $subtotal += $lineSubtotal;

                $items[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                    'subtotal' => $lineSubtotal,
                ];
            }

            $discount = $request->get('discount', 0);
            $tax = 0; // Tax can be added later if needed
            $grandTotal = $subtotal - $discount + $tax;
            $paidAmount = $request->get('paid_amount', $grandTotal);
            $changeAmount = max(0, $paidAmount - $grandTotal);

            // Create sale
            $sale = Sale::create([
                'invoice_no' => $invoiceNo,
                'user_id' => $user->id,
                'customer_id' => $request->customer_id ?? 1,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'grand_total' => $grandTotal,
                'paid_amount' => $paidAmount,
                'change_amount' => $changeAmount,
                'payment_method' => $request->payment_method,
                'payment_status' => $request->payment_status ?? 'paid',
                'notes' => $request->notes,
            ]);

            // Create sale items and update stock
            foreach ($items as $item) {
                $product = Product::find($item['product_id']);
                $product->decrement('stock', $item['quantity']);

                $saleItem = $sale->items()->create($item);

                // Record stock movement
                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => $user->id,
                    'type' => 'out',
                    'quantity' => $item['quantity'],
                    'stock_before' => $product->stock + $item['quantity'],
                    'stock_after' => $product->stock,
                    'reference_type' => 'sale',
                    'reference_id' => $sale->id,
                    'notes' => 'Penjualan ' . $invoiceNo,
                ]);
            }

            // Update customer points
            if ($request->customer_id && $request->customer_id != 1) {
                $customer = \App\Models\Customer::find($request->customer_id);
                if ($customer) {
                    $customer->increment('points', (int) ($grandTotal / 1000));
                }
            }

            $sale->load(['user:id,name', 'customer:id,name', 'items.product:id,name,code,price']);

            return response()->json([
                'message' => 'Transaksi berhasil',
                'sale' => $sale,
            ], 201);
        });
    }

    public function show(Sale $sale): JsonResponse
    {
        $sale->load(['user:id,name', 'customer:id,name,phone', 'items.product:id,name,code,price,image,category_id', 'items.product.category:id,name']);

        return response()->json($sale);
    }

    public function receipt(Sale $sale): JsonResponse
    {
        $sale->load(['user:id,name', 'customer:id,name,phone,address', 'items.product:id,name,code,price']);

        return response()->json([
            'store_name' => Setting::getValue('store_name', config('app.name', 'Minimarket Sekolah')),
            'store_address' => Setting::getValue('store_address', 'Jl. Sekolah No. 1'),
            'store_phone' => Setting::getValue('store_phone', '021-12345678'),
            'sale' => $sale,
        ]);
    }

    public function todaySales(): JsonResponse
    {
        $sales = Sale::with(['user:id,name', 'customer:id,name'])
            ->whereDate('created_at', today())
            ->latest()
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'invoice_no' => $sale->invoice_no,
                    'grand_total' => (float) $sale->grand_total,
                    'payment_method' => $sale->payment_method,
                    'created_at' => $sale->created_at->format('H:i:s'),
                    'cashier' => $sale->user->name,
                    'customer' => $sale->customer->name ?? 'Umum',
                ];
            });

        $total = Sale::whereDate('created_at', today())->sum('grand_total');
        $count = Sale::whereDate('created_at', today())->count();

        return response()->json([
            'sales' => $sales,
            'total' => (float) $total,
            'count' => $count,
        ]);
    }
}