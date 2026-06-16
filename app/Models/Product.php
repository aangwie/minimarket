<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'code',
        'name',
        'slug',
        'description',
        'price',
        'cost_price',
        'stock',
        'min_stock',
        'unit',
        'image',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($product) {
            if (empty($product->slug)) {
                $product->slug = Str::slug($product->name);
            }
            if (empty($product->code)) {
                $product->code = 'PRD-' . strtoupper(Str::random(8));
            }
        });
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('stock', '<=', 'min_stock');
    }

    public function scopeOutOfStock($query)
    {
        return $query->where('stock', '<=', 0);
    }

    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    // Accessors
    public function getIsLowStockAttribute(): bool
    {
        return $this->stock <= $this->min_stock;
    }

    public function getProfitAttribute()
    {
        return $this->price - $this->cost_price;
    }

    public function getProfitPercentAttribute()
    {
        if ($this->cost_price > 0) {
            return round(($this->profit / $this->cost_price) * 100, 2);
        }
        return 0;
    }

    // Relationships
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }
}