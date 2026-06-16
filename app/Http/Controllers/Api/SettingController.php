<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = Setting::all()->pluck('value', 'key');

        return response()->json($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'store_name' => 'required|string|max:255',
            'store_address' => 'required|string|max:500',
            'store_phone' => 'required|string|max:50',
        ]);

        Setting::setValue('store_name', $request->store_name);
        Setting::setValue('store_address', $request->store_address);
        Setting::setValue('store_phone', $request->store_phone);

        $settings = Setting::all()->pluck('value', 'key');

        return response()->json([
            'message' => 'Pengaturan berhasil disimpan',
            'settings' => $settings,
        ]);
    }
}