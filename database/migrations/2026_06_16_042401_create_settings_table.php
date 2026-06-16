<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Insert default settings
        DB::table('settings')->insert([
            ['key' => 'store_name', 'value' => 'Minimarket Sekolah', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'store_address', 'value' => 'Jl. Sekolah No. 1', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'store_phone', 'value' => '021-12345678', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};