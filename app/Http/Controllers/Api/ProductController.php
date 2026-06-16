<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with('category:id,name')
            ->withCount('saleItems');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhereHas('category', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('stock_status')) {
            if ($request->stock_status === 'low') {
                $query->lowStock();
            } elseif ($request->stock_status === 'out') {
                $query->outOfStock();
            }
        }

        if ($request->boolean('active_only')) {
            $query->active();
        }

        $perPage = $request->get('per_page', 10);
        $products = $query->orderBy('name')->paginate($perPage);

        return response()->json($products);
    }

    private function uploadAndConvertToWebp(Request $request, string $fieldName = 'image'): ?string
    {
        if (!$request->hasFile($fieldName)) {
            return null;
        }

        $image = $request->file($fieldName);

        if (!$image->isValid()) {
            Log::error('Product image upload: file is not valid');
            return null;
        }

        try {
            // Get image content and create GD resource
            $imageContent = file_get_contents($image->getRealPath());
            if (!$imageContent) {
                Log::error('Product image upload: cannot read file contents');
                return null;
            }

            $sourceImage = imagecreatefromstring($imageContent);
            if (!$sourceImage) {
                Log::error('Product image upload: GD cannot create image from string');
                return null;
            }

            // Resize if larger than 512px (for optimal display)
            $origWidth = imagesx($sourceImage);
            $origHeight = imagesy($sourceImage);
            $maxSize = 512;

            if ($origWidth > $maxSize || $origHeight > $maxSize) {
                $ratio = min($maxSize / $origWidth, $maxSize / $origHeight);
                $newWidth = (int) round($origWidth * $ratio);
                $newHeight = (int) round($origHeight * $ratio);

                $resizedImage = imagecreatetruecolor($newWidth, $newHeight);
                imagealphablending($resizedImage, false);
                imagesavealpha($resizedImage, true);
                imagecopyresampled($resizedImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);

                imagedestroy($sourceImage);
                $sourceImage = $resizedImage;
            }

            // Convert to WebP and capture output
            ob_start();
            $webpResult = imagewebp($sourceImage, null, 80);
            $webpData = ob_get_clean();
            imagedestroy($sourceImage);

            if (!$webpResult || !$webpData) {
                Log::error('Product image upload: WebP conversion failed');
                return null;
            }

            // Save WebP data directly to storage
            $filename = time() . '_' . Str::random(8) . '.webp';
            $saved = Storage::put('public/products/' . $filename, $webpData);

            if (!$saved) {
                Log::error('Product image upload: Storage::put failed for public/products/' . $filename);
                return null;
            }

            return 'storage/products/' . $filename;
        } catch (\Exception $e) {
            Log::error('Product image upload exception: ' . $e->getMessage());
            return null;
        }
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'min_stock' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        $data = $request->except('image');

        $imagePath = $this->uploadAndConvertToWebp($request);
        if ($imagePath) {
            $data['image'] = $imagePath;
        }

        $product = Product::create($data);
        $product->load('category:id,name');

        return response()->json([
            'message' => 'Produk berhasil ditambahkan',
            'product' => $product,
        ], 201);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load(['category:id,name', 'stockMovements' => function ($q) {
            $q->latest()->take(20);
        }, 'stockMovements.user:id,name']);

        return response()->json($product);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'min_stock' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'is_active' => 'boolean',
        ]);

        $data = $request->except('image');

        if ($request->hasFile('image')) {
            // Delete old image
            if ($product->image && Storage::exists(str_replace('storage/', 'public/', $product->image))) {
                Storage::delete(str_replace('storage/', 'public/', $product->image));
            }

            $imagePath = $this->uploadAndConvertToWebp($request);
            if ($imagePath) {
                $data['image'] = $imagePath;
            }
        }

        $product->update($data);
        $product->load('category:id,name');

        return response()->json([
            'message' => 'Produk berhasil diupdate',
            'product' => $product,
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        if ($product->saleItems()->count() > 0) {
            $product->update(['is_active' => false]);
            return response()->json([
                'message' => 'Produk tidak dapat dihapus karena memiliki riwayat penjualan. Status dinonaktifkan.',
            ]);
        }

        if ($product->image && Storage::exists(str_replace('storage/', 'public/', $product->image))) {
            Storage::delete(str_replace('storage/', 'public/', $product->image));
        }

        $product->delete();

        return response()->json([
            'message' => 'Produk berhasil dihapus',
        ]);
    }

    public function updateStock(Request $request, Product $product): JsonResponse
    {
        $request->validate([
            'stock' => 'required|integer|min:0',
        ]);

        $product->update([
            'stock' => $request->stock,
            'min_stock' => $request->min_stock ?? $product->min_stock,
        ]);

        return response()->json([
            'message' => 'Stok berhasil diupdate',
            'product' => $product->fresh()->load('category:id,name'),
        ]);
    }

    public function barcode($code): JsonResponse
    {
        $product = Product::with('category:id,name')
            ->where('code', $code)
            ->first();

        if (!$product) {
            return response()->json([
                'message' => 'Produk tidak ditemukan',
            ], 404);
        }

        return response()->json($product);
    }
}