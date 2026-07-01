<?php

declare(strict_types=1);

/** @var array{products: int, orders: int, todayBills: int, todaySales: float} $stats */
/** @var list<array<string, mixed>> $recentOrders */
/** @var list<array<string, mixed>> $navItems */
/** @var string $currency */

ob_start();
$title = 'Dashboard';

$hour = (int) date('G');
$greeting = $hour < 12 ? 'Good morning' : ($hour < 17 ? 'Good afternoon' : 'Good evening');
$quickLinks = array_values(array_filter($navItems, static fn(array $i): bool => $i['path'] !== '/'));
?>
<div class="flex flex-col gap-6 sm:gap-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
            <h1 class="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
                <?= e($greeting) ?>, <?= e($user['name'] ?? 'there') ?>
            </h1>
            <p class="text-slate-600 text-sm mt-1">Here's a quick snapshot of your store today.</p>
        </div>
        <div class="text-right text-sm text-slate-500">
            <p class="font-semibold text-slate-700"><?= e(date('l, d M Y')) ?></p>
            <p><?= e(date('h:i A')) ?></p>
        </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card p-5 bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-100 border-2 border-emerald-300/80">
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <p class="text-emerald-800 text-xs font-bold uppercase tracking-wider">Today's sales</p>
            <p class="text-2xl sm:text-3xl font-extrabold mt-2 text-emerald-950"><?= e(money($stats['todaySales'], $currency)) ?></p>
        </div>
        <div class="card p-5 bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 border-2 border-sky-300/80">
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 to-blue-600"></div>
            <p class="text-sky-800 text-xs font-bold uppercase tracking-wider">Orders today</p>
            <p class="text-2xl sm:text-3xl font-extrabold mt-2 text-sky-950"><?= (int) $stats['todayBills'] ?></p>
        </div>
        <div class="card p-5 bg-gradient-to-br from-violet-100 via-fuchsia-50 to-purple-100 border-2 border-violet-300/80">
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600"></div>
            <p class="text-violet-800 text-xs font-bold uppercase tracking-wider">Total orders</p>
            <p class="text-2xl sm:text-3xl font-extrabold mt-2 text-violet-950"><?= (int) $stats['orders'] ?></p>
        </div>
        <div class="card p-5 bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 border-2 border-amber-300/80">
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500"></div>
            <p class="text-amber-800 text-xs font-bold uppercase tracking-wider">Products</p>
            <p class="text-2xl sm:text-3xl font-extrabold mt-2 text-amber-950"><?= (int) $stats['products'] ?></p>
        </div>
    </div>

    <?php if ($recentOrders !== []): ?>
        <div class="card card-accent">
            <div class="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 class="text-lg font-bold text-slate-900">Recent bills</h2>
                <a href="<?= base_url('/recent-bills') ?>" class="text-sm font-semibold text-blue-600 hover:text-blue-800">View all →</a>
            </div>
            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($recentOrders as $order): ?>
                            <tr>
                                <td><a href="<?= base_url('/invoice/' . ($order['id'] ?? '')) ?>" class="font-semibold text-blue-600 hover:underline"><?= e($order['id']) ?></a></td>
                                <td><?= e(format_date($order['date'] ?? '')) ?></td>
                                <td><?= count($order['items'] ?? []) ?></td>
                                <td class="text-right font-semibold"><?= e(money((float) ($order['total'] ?? 0), $currency)) ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    <?php endif; ?>

    <div>
        <h2 class="text-lg font-bold text-slate-900 mb-4">Quick navigation</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <?php foreach ($quickLinks as $item): ?>
                <a href="<?= e(base_url($item['path'])) ?>" class="card p-6 hover:shadow-lg hover:border-violet-200 transition-all group">
                    <div class="flex items-center gap-4">
                        <span class="w-12 h-12 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform"><?= nav_icon((string) ($item['icon'] ?? '')) ?></span>
                        <div>
                            <p class="font-bold text-slate-900"><?= e($item['label']) ?></p>
                            <p class="text-slate-500 text-sm mt-1">Open <?= e(strtolower($item['label'])) ?></p>
                        </div>
                    </div>
                </a>
            <?php endforeach; ?>
        </div>
    </div>
</div>
<?php require __DIR__ . '/../partials/end-layout.php'; ?>
