<?php

declare(strict_types=1);

/** @var list<array<string, mixed>> $orders */
/** @var list<array<string, mixed>> $products */

ob_start();
$title = 'Reports';

$totalSales = 0.0;
$totalBills = count($orders);
foreach ($orders as $o) {
    $totalSales += (float) ($o['total'] ?? 0);
}

$byDate = [];
foreach ($orders as $order) {
    $day = substr((string) ($order['date'] ?? ''), 0, 10);
    if ($day === '') {
        continue;
    }
    if (!isset($byDate[$day])) {
        $byDate[$day] = ['bills' => 0, 'sales' => 0.0];
    }
    $byDate[$day]['bills']++;
    $byDate[$day]['sales'] += (float) ($order['total'] ?? 0);
}
krsort($byDate);
?>
<div class="flex flex-col gap-6" x-data="{ from: '', to: '' }">
    <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">Sales reports</h1>
        <p class="text-slate-600 text-sm mt-1">Summary of billed sales by date.</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="card p-5 bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-emerald-300/80">
            <p class="text-xs font-bold uppercase text-emerald-800 tracking-wider">Total sales</p>
            <p class="text-2xl font-extrabold text-emerald-950 mt-2"><?= e(money($totalSales, $currency)) ?></p>
        </div>
        <div class="card p-5 bg-gradient-to-br from-sky-100 to-blue-100 border-2 border-sky-300/80">
            <p class="text-xs font-bold uppercase text-sky-800 tracking-wider">Total bills</p>
            <p class="text-2xl font-extrabold text-sky-950 mt-2"><?= $totalBills ?></p>
        </div>
        <div class="card p-5 bg-gradient-to-br from-violet-100 to-fuchsia-100 border-2 border-violet-300/80">
            <p class="text-xs font-bold uppercase text-violet-800 tracking-wider">Products</p>
            <p class="text-2xl font-extrabold text-violet-950 mt-2"><?= count($products) ?></p>
        </div>
    </div>

    <div class="card card-accent p-5">
        <div class="flex flex-wrap gap-4 items-end mb-4">
            <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">From</label>
                <input type="date" x-model="from" class="field-input w-auto">
            </div>
            <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">To</label>
                <input type="date" x-model="to" class="field-input w-auto">
            </div>
            <button type="button" @click="from = ''; to = ''" class="btn btn-outline text-sm">Clear filter</button>
        </div>

        <div class="overflow-x-auto">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th class="text-right">Bills</th>
                        <th class="text-right">Sales</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($byDate as $day => $row): ?>
                        <tr x-show="(!from || '<?= e($day) ?>' >= from) && (!to || '<?= e($day) ?>' <= to)">
                            <td class="font-semibold"><?= e(date('d M Y', strtotime($day))) ?></td>
                            <td class="text-right"><?= (int) $row['bills'] ?></td>
                            <td class="text-right font-bold text-violet-700"><?= e(money($row['sales'], $currency)) ?></td>
                        </tr>
                    <?php endforeach; ?>
                    <?php if ($byDate === []): ?>
                        <tr><td colspan="3" class="text-center text-slate-500 py-8">No sales data yet.</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>
<?php require __DIR__ . '/../partials/end-layout.php'; ?>
