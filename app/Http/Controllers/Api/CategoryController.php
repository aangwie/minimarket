<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Category::withCount('products');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 10);
        $categories = $query->orderBy('name')->paginate($perPage);

        return response()->json($categories);
    }

    public function all(): JsonResponse
    {
        $categories = Category::withCount('products')->orderBy('name')->get();
        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $category = Category::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
        ]);

        return response()->json([
            'message' => 'Kategori berhasil ditambahkan',
            'category' => $category,
        ], 201);
    }

    public function show(Category $category): JsonResponse
    {
        $category->loadCount('products');
        return response()->json($category);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $category->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'description' => $request->description,
        ]);

        return response()->json([
            'message' => 'Kategori berhasil diupdate',
            'category' => $category,
        ]);
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->count() > 0) {
            return response()->json([
                'message' => 'Kategori tidak dapat dihapus karena masih memiliki produk',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Kategori berhasil dihapus',
        ]);
    }
}