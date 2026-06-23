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
            // QRIS settings
            'qris_type' => 'nullable|string|in:dana,upload,interactive',
            'qris_dana_url' => 'nullable|string|max:500',
            'qris_interactive_url' => 'nullable|string|max:500',
            'qris_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:512',
        ];

        $request->validate($rules);

        Setting::setValue('store_name', $request->store_name);
        Setting::setValue('store_address', $request->store_address);
        Setting::setValue('store_phone', $request->store_phone);

        // Save QRIS settings
        if ($request->has('qris_type')) {
            Setting::setValue('qris_type', $request->qris_type);
        }
        if ($request->has('qris_dana_url')) {
            Setting::setValue('qris_dana_url', $request->qris_dana_url);
        }
        if ($request->has('qris_interactive_url')) {
            Setting::setValue('qris_interactive_url', $request->qris_interactive_url);
        }

        // Handle QRIS image upload
        if ($request->hasFile('qris_image')) {
            $image = $request->file('qris_image');
            $base64Qris = $this->processAndConvertToWebP($image);
            if ($base64Qris) {
                Setting::setValue('qris_image', $base64Qris);
            }
        }

        // Handle store logo upload
        if ($request->hasFile('store_logo')) {
            $image = $request->file('store_logo');
            $base64Logo = $this->processAndConvertToWebP($image);
            if ($base64Logo) {
                Setting::setValue('store_logo', $base64Logo);
            }
        }

        $settings = Setting::all()->pluck('value', 'key');

        return response()->json([
            'message' => 'Pengaturan berhasil disimpan',
            'settings' => $settings,
        ]);
    }

    /**
     * Process an uploaded image file, resize if needed, and convert to WebP base64.
     *
     * @param \Illuminate\Http\UploadedFile $image
     * @param int $maxSize
     * @return string|null
     */
    private function processAndConvertToWebP($image, int $maxSize = 256): ?string
    {
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

        if (!$sourceImage) {
            return null;
        }

        // Get original dimensions
        $origWidth = imagesx($sourceImage);
        $origHeight = imagesy($sourceImage);

        // Resize if larger than maxSize
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

        return base64_encode($webpData);
    }
}