<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Supplier::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 10);
        $suppliers = $query->orderBy('name')->paginate($perPage);

        return response()->json($suppliers);
    }

    public function all(): JsonResponse
    {
        return response()->json(Supplier::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
        ]);

        $supplier = Supplier::create($request->all());

        return response()->json([
            'message' => 'Supplier berhasil ditambahkan',
            'supplier' => $supplier,
        ], 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return response()->json($supplier);
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
        ]);

        $supplier->update($request->all());

        return response()->json([
            'message' => 'Supplier berhasil diupdate',
            'supplier' => $supplier,
        ]);
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        $supplier->delete();

        return response()->json([
            'message' => 'Supplier berhasil dihapus',
        ]);
    }
}