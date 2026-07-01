<?php

declare(strict_types=1);

/** @var array<string, mixed> $settings */

ob_start();
$title = 'Settings';
$s = $settings;
?>
<div class="flex flex-col gap-6">
    <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">Settings</h1>
        <p class="text-slate-600 text-sm mt-1">Store profile, tax, currency, and billing defaults.</p>
    </div>

    <form action="<?= base_url('/settings/save') ?>" method="post" class="space-y-6 max-w-3xl">
        <div class="card card-accent p-5 sm:p-6 space-y-4">
            <h2 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">🏪 Store profile</h2>
            <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Store name</label>
                <input type="text" name="storeName" class="field-input" value="<?= e($s['storeName'] ?? '') ?>">
            </div>
            <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                <textarea name="storeAddress" rows="3" class="field-input"><?= e($s['storeAddress'] ?? '') ?></textarea>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">GSTIN</label>
                    <input type="text" name="storeGstin" class="field-input" value="<?= e($s['storeGstin'] ?? '') ?>">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Website</label>
                    <input type="url" name="storeWebsite" class="field-input" value="<?= e($s['storeWebsite'] ?? '') ?>">
                </div>
            </div>
            <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">UPI ID</label>
                <input type="text" name="storeUpiId" class="field-input" value="<?= e($s['storeUpiId'] ?? '') ?>">
            </div>
        </div>

        <div class="card card-accent p-5 sm:p-6 space-y-4">
            <h2 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">💰 Tax &amp; currency</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Default tax rate (%)</label>
                    <input type="number" name="taxRate" step="0.01" min="0" class="field-input" value="<?= e((string) ($s['taxRate'] ?? 5)) ?>">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Currency symbol</label>
                    <select name="currency" class="field-select">
                        <?php foreach (['₹' => 'INR (₹)', '$' => 'USD ($)', '€' => 'EUR (€)'] as $val => $label): ?>
                            <option value="<?= e($val) ?>" <?= ($s['currency'] ?? '₹') === $val ? 'selected' : '' ?>><?= e($label) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>
        </div>

        <div class="card card-accent p-5 sm:p-6 space-y-4">
            <h2 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">🏷️ Discounts</h2>
            <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="discountEnabled" value="1" class="w-4 h-4 rounded border-slate-300 text-blue-600" <?= !empty($s['discountEnabled']) ? 'checked' : '' ?>>
                <span class="text-sm font-medium text-slate-700">Enable product discounts (MRP savings)</span>
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Discount type</label>
                    <select name="discountType" class="field-select">
                        <option value="percent" <?= ($s['discountType'] ?? '') === 'percent' ? 'selected' : '' ?>>Percent of MRP</option>
                        <option value="amount" <?= ($s['discountType'] ?? '') === 'amount' ? 'selected' : '' ?>>Fixed amount per unit</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Max discount %</label>
                    <input type="number" name="maxDiscountPercent" step="0.01" min="0" max="100" class="field-input" value="<?= e((string) ($s['maxDiscountPercent'] ?? 50)) ?>">
                </div>
            </div>
            <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="billDiscountEnabled" value="1" class="w-4 h-4 rounded border-slate-300 text-blue-600" <?= !empty($s['billDiscountEnabled']) ? 'checked' : '' ?>>
                <span class="text-sm font-medium text-slate-700">Enable bill-level discount at checkout</span>
            </label>
        </div>

        <button type="submit" class="btn btn-primary px-8 py-3">Save settings</button>
    </form>
</div>
<?php require __DIR__ . '/../partials/end-layout.php'; ?>
