<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockMovementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = StockMovement::with(['product:id,name,code', 'user:id,name']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $perPage = $request->get('per_page', 10);
        $movements = $query->latest()->paginate($perPage);

        return response()->json($movements);
    }

    public function stockIn(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request) {
            $product = Product::findOrFail($request->product_id);
            $user = $request->user();

            $stockBefore = $product->stock;
            $product->increment('stock', $request->quantity);

            $movement = StockMovement::create([
                'product_id' => $product->id,
                'user_id' => $user->id,
                'type' => 'in',
                'quantity' => $request->quantity,
                'stock_before' => $stockBefore,
                'stock_after' => $product->fresh()->stock,
                'notes' => $request->notes ?? 'Stok masuk manual',
            ]);

            $movement->load(['product:id,name,code', 'user:id,name']);

            return response()->json([
                'message' => 'Stok berhasil ditambahkan',
                'movement' => $movement,
            ], 201);
        });
    }

    public function stockOut(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request) {
            $product = Product::findOrFail($request->product_id);
            $user = $request->user();

            if ($product->stock < $request->quantity) {
                return response()->json([
                    'message' => "Stok {$product->name} tidak mencukupi. Stok tersedia: {$product->stock}",
                ], 422);
            }

            $stockBefore = $product->stock;
            $product->decrement('stock', $request->quantity);

            $movement = StockMovement::create([
                'product_id' => $product->id,
                'user_id' => $user->id,
                'type' => 'out',
                'quantity' => $request->quantity,
                'stock_before' => $stockBefore,
                'stock_after' => $product->fresh()->stock,
                'notes' => $request->notes ?? 'Stok keluar manual',
            ]);

            $movement->load(['product:id,name,code', 'user:id,name']);

            return response()->json([
                'message' => 'Stok berhasil dikurangi',
                'movement' => $movement,
            ], 201);
        });
    }

    public function lowStock(): JsonResponse
    {
        $products = Product::with('category:id,name')
            ->lowStock()
            ->orderBy('stock')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'code' => $product->code,
                    'name' => $product->name,
                    'category' => $product->category->name ?? '-',
                    'stock' => $product->stock,
                    'min_stock' => $product->min_stock,
                    'unit' => $product->unit,
                    'price' => (float) $product->price,
                ];
            });

        return response()->json([
            'count' => $products->count(),
            'products' => $products,
        ]);
    }
}