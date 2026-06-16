<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Customer::withCount('sales');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 10);
        $customers = $query->orderBy('name')->paginate($perPage);

        return response()->json($customers);
    }

    public function all(): JsonResponse
    {
        return response()->json(Customer::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
        ]);

        $customer = Customer::create($request->all());

        return response()->json([
            'message' => 'Pelanggan berhasil ditambahkan',
            'customer' => $customer,
        ], 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        $customer->load(['sales' => function ($q) {
            $q->latest()->take(20);
        }, 'sales.user:id,name']);

        return response()->json($customer);
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
        ]);

        $customer->update($request->all());

        return response()->json([
            'message' => 'Pelanggan berhasil diupdate',
            'customer' => $customer,
        ]);
    }

    public function destroy(Customer $customer): JsonResponse
    {
        if ($customer->sales()->count() > 0) {
            return response()->json([
                'message' => 'Pelanggan tidak dapat dihapus karena memiliki riwayat transaksi',
            ], 422);
        }

        $customer->delete();

        return response()->json([
            'message' => 'Pelanggan berhasil dihapus',
        ]);
    }
}