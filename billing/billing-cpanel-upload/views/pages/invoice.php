<?php

declare(strict_types=1);

/** @var array<string, mixed> $order */
/** @var bool $print */

ob_start();
$title = 'Invoice ' . ($order['id'] ?? '');
$items = $order['items'] ?? [];
$store = $settings;
?>
<div class="max-w-3xl mx-auto">
    <div class="no-print flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
            <h1 class="text-2xl font-extrabold text-slate-900">Invoice <?= e($order['id'] ?? '') ?></h1>
            <p class="text-slate-500 text-sm mt-1"><?= e(format_date($order['date'] ?? '')) ?></p>
        </div>
        <div class="flex gap-2">
            <a href="<?= base_url('/recent-bills') ?>" class="btn btn-outline text-sm">← Back</a>
            <button type="button" onclick="window.print()" class="btn btn-primary text-sm">🖨 Print</button>
        </div>
    </div>

    <div class="invoice-preview-root card p-6 sm:p-8 border-2 border-slate-200" id="invoice-print">
        <div class="text-center border-b border-slate-200 pb-4 mb-4">
            <h2 class="text-xl font-extrabold text-slate-900"><?= e($store['storeName'] ?? 'Store') ?></h2>
            <?php if (!empty($store['storeAddress'])): ?>
                <p class="text-sm text-slate-600 mt-1"><?= e($store['storeAddress']) ?></p>
            <?php endif; ?>
            <?php if (!empty($store['storeGstin'])): ?>
                <p class="text-xs text-slate-500 mt-1">GSTIN: <?= e($store['storeGstin']) ?></p>
            <?php endif; ?>
            <p class="text-sm font-semibold text-violet-700 mt-2">TAX INVOICE</p>
            <p class="text-xs text-slate-500">Bill #<?= e($order['id'] ?? '') ?> · <?= e(format_date($order['date'] ?? '')) ?></p>
        </div>

        <?php if (!empty($order['customerName']) || !empty($order['customerMobile'])): ?>
            <div class="mb-4 text-sm">
                <p class="font-semibold text-slate-700">Customer</p>
                <?php if (!empty($order['customerName'])): ?><p><?= e($order['customerName']) ?></p><?php endif; ?>
                <?php if (!empty($order['customerMobile'])): ?><p class="text-slate-500"><?= e($order['customerMobile']) ?></p><?php endif; ?>
            </div>
        <?php endif; ?>

        <table class="w-full text-sm mb-4">
            <thead>
                <tr>
                    <th class="text-left">Item</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Rate</th>
                    <th class="text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($items as $item): ?>
                    <?php $lineTotal = (float) ($item['lineTotal'] ?? ((float) ($item['price'] ?? 0) * (float) ($item['qty'] ?? 1))); ?>
                    <tr>
                        <td>
                            <span class="font-medium"><?= e($item['name'] ?? '') ?></span>
                            <?php if (!empty($item['hsn'])): ?>
                                <span class="text-xs text-slate-500 block">HSN: <?= e($item['hsn']) ?></span>
                            <?php endif; ?>
                        </td>
                        <td class="text-right"><?= e((string) ($item['qty'] ?? 1)) ?></td>
                        <td class="text-right"><?= e(money((float) ($item['price'] ?? 0), $currency)) ?></td>
                        <td class="text-right font-semibold"><?= e(money($lineTotal, $currency)) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <div class="border-t border-slate-200 pt-4 space-y-1 text-sm max-w-xs ml-auto">
            <div class="flex justify-between"><span class="text-slate-600">Gross subtotal</span><span><?= e(money((float) ($order['grossSubtotal'] ?? 0), $currency)) ?></span></div>
            <?php if ((float) ($order['discountTotal'] ?? 0) > 0): ?>
                <div class="flex justify-between text-emerald-700"><span>Discount</span><span>−<?= e(money((float) $order['discountTotal'], $currency)) ?></span></div>
            <?php endif; ?>
            <div class="flex justify-between"><span class="text-slate-600">Tax (incl.)</span><span><?= e(money((float) ($order['tax'] ?? 0), $currency)) ?></span></div>
            <?php if ((float) ($order['billDiscountAmount'] ?? 0) > 0): ?>
                <div class="flex justify-between text-emerald-700"><span>Bill discount</span><span>−<?= e(money((float) $order['billDiscountAmount'], $currency)) ?></span></div>
            <?php endif; ?>
            <div class="flex justify-between text-lg font-extrabold text-violet-800 pt-2 border-t border-slate-200 mt-2">
                <span>Total</span>
                <span><?= e(money((float) ($order['total'] ?? 0), $currency)) ?></span>
            </div>
        </div>

        <?php if (!empty($store['storeUpiId'])): ?>
            <p class="text-center text-xs text-slate-500 mt-6">UPI: <?= e($store['storeUpiId']) ?></p>
        <?php endif; ?>
        <p class="text-center text-xs text-slate-400 mt-4">Thank you for shopping with us!</p>
    </div>
</div>

<?php if (!empty($print)): ?>
<script>window.addEventListener('load', () => window.print());</script>
<?php endif; ?>
<?php require __DIR__ . '/../partials/end-layout.php'; ?>
