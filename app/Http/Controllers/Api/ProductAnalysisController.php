<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\SaleItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductAnalysisController extends Controller
{
    /**
     * Get products frequently bought together with the given product.
     *
     * @param Request $request
     * @param Product $product
     * @return JsonResponse
     */
    public function frequentlyBoughtTogether(Request $request, Product $product): JsonResponse
    {
        // Get all sale IDs where this product was purchased
        $saleIds = SaleItem::where('product_id', $product->id)
            ->pluck('sale_id')
            ->unique();

        $totalSalesWithProduct = $saleIds->count();

        if ($totalSalesWithProduct === 0) {
            return response()->json([
                'success' => true,
                'data' => [
                    'product' => $product->load('category'),
                    'total_sales_with_product' => 0,
                    'related_products' => [],
                ],
            ]);
        }

        // Find other products in those same sales, count frequency
        $relatedProducts = SaleItem::whereIn('sale_id', $saleIds)
            ->where('product_id', '!=', $product->id)
            ->selectRaw('product_id, COUNT(*) as frequency')
            ->groupBy('product_id')
            ->orderByDesc('frequency')
            ->limit(20)
            ->get();

        // Calculate "bought together" percentage
        $relatedProducts->load('product.category');
        $results = $relatedProducts->map(function ($item) use ($totalSalesWithProduct) {
            $product = $item->product;
            if (!$product) return null;

            return [
                'id' => $product->id,
                'code' => $product->code,
                'name' => $product->name,
                'category' => $product->category ? $product->category->name : '-',
                'price' => (float) $product->price,
                'stock' => (int) $product->stock,
                'unit' => $product->unit,
                'frequency' => (int) $item->frequency,
                'percentage' => round(($item->frequency / $totalSalesWithProduct) * 100, 1),
            ];
        })->filter()->values();

        return response()->json([
            'success' => true,
            'data' => [
                'product' => $product->load('category'),
                'total_sales_with_product' => $totalSalesWithProduct,
                'related_products' => $results,
            ],
        ]);
    }

    /**
     * Get all products for the product selector.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function products(Request $request): JsonResponse
    {
        $search = $request->get('search');
        $query = Product::active()->with('category');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $products = $query->orderBy('name')->limit(50)->get();

        return response()->json([
            'success' => true,
            'data' => $products->map(function ($product) {
                return [
                    'id' => $product->id,
                    'code' => $product->code,
                    'name' => $product->name,
                    'category' => $product->category ? $product->category->name : '-',
                    'price' => (float) $product->price,
                    'stock' => (int) $product->stock,
                ];
            }),
        ]);
    }

    /**
     * Get best-selling categories report.
     *
     * @return JsonResponse
     */
    public function topCategories(): JsonResponse
    {
        $categories = Category::select(
                'categories.id',
                'categories.name',
                DB::raw('COUNT(DISTINCT sale_items.id) as total_items'),
                DB::raw('SUM(sale_items.subtotal) as total_revenue'),
                DB::raw('COUNT(DISTINCT sale_items.sale_id) as total_transactions')
            )
            ->join('products', 'products.category_id', '=', 'categories.id')
            ->join('sale_items', 'sale_items.product_id', '=', 'products.id')
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('total_items')
            ->get();

        $grandTotalItems = $categories->sum('total_items');

        $data = $categories->map(function ($category) use ($grandTotalItems) {
            return [
                'name' => $category->name,
                'total_items' => (int) $category->total_items,
                'total_revenue' => (float) $category->total_revenue,
                'total_transactions' => (int) $category->total_transactions,
                'percentage' => $grandTotalItems > 0
                    ? round(($category->total_items / $grandTotalItems) * 100, 1)
                    : 0,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}