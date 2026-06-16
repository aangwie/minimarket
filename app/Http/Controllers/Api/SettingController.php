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

        // Decode base64 logo for response if exists
        if (isset($settings['store_logo'])) {
            $settings['store_logo'] = $settings['store_logo'];
        }

        return response()->json($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $rules = [
            'store_name' => 'required|string|max:255',
            'store_address' => 'required|string|max:500',
            'store_phone' => 'required|string|max:50',
            'store_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:512',
        ];

        $request->validate($rules);

        Setting::setValue('store_name', $request->store_name);
        Setting::setValue('store_address', $request->store_address);
        Setting::setValue('store_phone', $request->store_phone);

        if ($request->hasFile('store_logo')) {
            $image = $request->file('store_logo');

            // Create image resource from uploaded file
            $sourceImage = null;
            $extension = strtolower($image->getClientOriginalExtension());

            switch ($extension) {
                case 'jpeg':
                case 'jpg':
                    $sourceImage = @imagecreatefromjpeg($image->getRealPath());
                    break;
                case 'png':
                    $sourceImage = @imagecreatefrompng($image->getRealPath());
                    break;
                case 'gif':
                    $sourceImage = @imagecreatefromgif($image->getRealPath());
                    break;
                case 'webp':
                    $sourceImage = @imagecreatefromwebp($image->getRealPath());
                    break;
            }

            if ($sourceImage) {
                // Get original dimensions
                $origWidth = imagesx($sourceImage);
                $origHeight = imagesy($sourceImage);

                // Resize if larger than 256px (for optimal display)
                $maxSize = 256;
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

                // Convert to WebP
                ob_start();
                imagewebp($sourceImage, null, 80);
                $webpData = ob_get_clean();
                imagedestroy($sourceImage);

                $base64Logo = base64_encode($webpData);
                Setting::setValue('store_logo', $base64Logo);
            }
        }

        $settings = Setting::all()->pluck('value', 'key');

        return response()->json([
            'message' => 'Pengaturan berhasil disimpan',
            'settings' => $settings,
        ]);
    }
}