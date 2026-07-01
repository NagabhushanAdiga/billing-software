<?php

declare(strict_types=1);

/** @var list<array<string, mixed>> $orders */

ob_start();
$title = 'Recently billed';
?>
<div class="flex flex-col gap-6">
    <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">Recently billed</h1>
        <p class="text-slate-600 text-sm mt-1">View and reprint past invoices.</p>
    </div>

    <div class="card card-accent overflow-hidden">
        <?php if ($orders === []): ?>
            <div class="px-5 py-16 text-center text-slate-500">
                <p class="text-lg font-semibold text-slate-700">No bills yet</p>
                <p class="text-sm mt-2">Create your first bill from <a href="<?= base_url('/pos') ?>" class="text-blue-600 font-semibold hover:underline">POS / Billing</a>.</p>
            </div>
        <?php else: ?>
            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th class="text-right">Total</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($orders as $order): ?>
                            <tr>
                                <td class="font-semibold text-slate-900"><?= e($order['id']) ?></td>
                                <td><?= e(format_date($order['date'] ?? '')) ?></td>
                                <td>
                                    <?php if (!empty($order['customerName'])): ?>
                                        <?= e($order['customerName']) ?>
                                        <?php if (!empty($order['customerMobile'])): ?>
                                            <span class="text-slate-500 text-xs block"><?= e($order['customerMobile']) ?></span>
                                        <?php endif; ?>
                                    <?php else: ?>
                                        <span class="text-slate-400">Walk-in</span>
                                    <?php endif; ?>
                                </td>
                                <td><?= count($order['items'] ?? []) ?></td>
                                <td class="text-right font-bold text-violet-700"><?= e(money((float) ($order['total'] ?? 0), $currency)) ?></td>
                                <td class="text-right whitespace-nowrap">
                                    <a href="<?= base_url('/invoice/' . ($order['id'] ?? '')) ?>" class="text-blue-600 font-semibold hover:underline text-sm">View</a>
                                    <span class="text-slate-300 mx-1">|</span>
                                    <a href="<?= base_url('/invoice/' . ($order['id'] ?? '') . '?print=1') ?>" class="text-blue-600 font-semibold hover:underline text-sm" target="_blank">Print</a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>
<?php require __DIR__ . '/../partials/end-layout.php'; ?>
