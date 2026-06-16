<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Penjualan</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 9px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #FF6B00;
        }
        .header h1 {
            font-size: 18px;
            color: #FF6B00;
            margin: 0 0 5px 0;
        }
        .header p {
            margin: 2px 0;
            color: #666;
            font-size: 10px;
        }
        .summary {
            margin-bottom: 20px;
        }
        .summary table {
            width: 100%;
            border-collapse: collapse;
        }
        .summary table td {
            padding: 5px 10px;
            border: 1px solid #ddd;
            text-align: center;
        }
        .summary .label {
            font-weight: bold;
            font-size: 8px;
            color: #666;
            text-transform: uppercase;
        }
        .summary .value {
            font-size: 13px;
            font-weight: bold;
            color: #333;
        }
        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        table.items th {
            background-color: #FF6B00;
            color: white;
            padding: 6px 8px;
            text-align: left;
            font-size: 8px;
            text-transform: uppercase;
        }
        table.items td {
            padding: 5px 8px;
            border-bottom: 1px solid #eee;
        }
        table.items tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 8px;
            color: #999;
        }
        .profit {
            color: #059669;
            font-weight: bold;
        }
        .grand-total-row td {
            font-weight: bold;
            background-color: #fff3e6 !important;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $store_name }}</h1>
        <p>Laporan Penjualan</p>
        <p>Periode: {{ \Carbon\Carbon::parse($date_from)->translatedFormat('d F Y') }} - {{ \Carbon\Carbon::parse($date_to)->translatedFormat('d F Y') }}</p>
        <p>Dicetak: {{ $generated_at }}</p>
    </div>

    <div class="summary">
        <table>
            <tr>
                <td><div class="label">Total Transaksi</div><div class="value">{{ number_format($summary['total_sales'], 0, ',', '.') }}</div></td>
                <td><div class="label">Total Pendapatan</div><div class="value">Rp {{ number_format($summary['total_revenue'], 0, ',', '.') }}</div></td>
                <td><div class="label">Total Diskon</div><div class="value">Rp {{ number_format($summary['total_discount'], 0, ',', '.') }}</div></td>
                <td><div class="label">Total Laba</div><div class="value profit">Rp {{ number_format($summary['total_profit'], 0, ',', '.') }}</div></td>
                <td><div class="label">Item Terjual</div><div class="value">{{ number_format($summary['total_items_sold'], 0, ',', '.') }}</div></td>
            </tr>
        </table>
    </div>

    <table class="items">
        <thead>
            <tr>
                <th>No</th>
                <th>Invoice</th>
                <th>Tanggal</th>
                <th>Kasir</th>
                <th>Pelanggan</th>
                <th>Item</th>
                <th>Subtotal</th>
                <th>Diskon</th>
                <th>Total</th>
                <th>Bayar</th>
                <th>Metode</th>
                <th>Laba</th>
            </tr>
        </thead>
        <tbody>
            @forelse($sales as $index => $sale)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ $sale->invoice_no }}</td>
                <td>{{ $sale->created_at->translatedFormat('d/m/Y H:i') }}</td>
                <td>{{ $sale->user->name ?? '-' }}</td>
                <td>{{ $sale->customer->name ?? 'Umum' }}</td>
                <td class="text-center">{{ $sale->items->sum('quantity') }}</td>
                <td class="text-right">Rp {{ number_format($sale->subtotal, 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($sale->discount, 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($sale->grand_total, 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($sale->paid_amount, 0, ',', '.') }}</td>
                <td>{{ strtoupper($sale->payment_method) }}</td>
                <td class="text-right profit">
                    Rp {{ number_format($sale->items->sum(function($item) { return ($item->price - ($item->product->cost_price ?? 0)) * $item->quantity; }), 0, ',', '.') }}
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="12" class="text-center" style="padding: 20px; color: #999;">Tidak ada data penjualan pada periode ini</td>
            </tr>
            @endforelse
        </tbody>
        @if(count($sales) > 0)
        <tfoot>
            <tr class="grand-total-row">
                <td colspan="6" class="text-right">GRAND TOTAL</td>
                <td class="text-right">Rp {{ number_format($sales->sum('subtotal'), 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($sales->sum('discount'), 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($sales->sum('grand_total'), 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($sales->sum('paid_amount'), 0, ',', '.') }}</td>
                <td></td>
                <td class="text-right profit">Rp {{ number_format($summary['total_profit'], 0, ',', '.') }}</td>
            </tr>
        </tfoot>
        @endif
    </table>

    <div class="footer">
        <p>{{ $store_name }} &mdash; Laporan ini digenerate secara otomatis pada {{ $generated_at }}</p>
    </div>
</body>
</html>