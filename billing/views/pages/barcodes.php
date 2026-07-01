<?php

declare(strict_types=1);

/** @var list<array<string, mixed>> $products */

ob_start();
$title = 'Barcodes';
?>
<div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">Barcodes</h1>
            <p class="text-slate-600 text-sm mt-1">View product barcodes and print labels.</p>
        </div>
        <button type="button" onclick="window.print()" class="btn btn-primary no-print">🖨 Print list</button>
    </div>

    <div class="card card-accent overflow-hidden">
        <?php if ($products === []): ?>
            <div class="px-5 py-16 text-center text-slate-500">No products with barcodes yet.</div>
        <?php else: ?>
            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Barcode</th>
                            <th>Product</th>
                            <th class="text-right">Price</th>
                            <th class="no-print"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($products as $product): ?>
                            <tr>
                                <td>
                                    <span class="font-mono text-lg font-bold tracking-wider text-violet-800"><?= e($product['barcode'] ?? '') ?></span>
                                </td>
                                <td class="font-semibold"><?= e($product['name'] ?? '') ?></td>
                                <td class="text-right"><?= e(money((float) ($product['price'] ?? 0), $currency)) ?></td>
                                <td class="text-right no-print">
                                    <button type="button" onclick="printLabel(<?= e(json_encode(['barcode' => $product['barcode'] ?? '', 'name' => $product['name'] ?? '', 'price' => $product['price'] ?? 0], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT)) ?>)" class="text-blue-600 font-semibold text-sm hover:underline">Print label</button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>

<script>
function printLabel(product) {
    const w = window.open('', '_blank', 'width=320,height=200');
    if (!w) return;
    const cur = <?= json_encode($currency, JSON_THROW_ON_ERROR) ?>;
    w.document.write('<html><head><title>Label</title><style>body{font-family:monospace;text-align:center;padding:16px} .bc{font-size:22px;font-weight:bold;letter-spacing:2px;margin:8px 0} .name{font-size:14px}</style></head><body>');
    w.document.write('<div class="name">' + product.name + '</div>');
    w.document.write('<div class="bc">' + product.barcode + '</div>');
    w.document.write('<div>' + cur + Number(product.price).toFixed(2) + '</div>');
    w.document.write('</body></html>');
    w.document.close();
    w.print();
}
</script>
<?php require __DIR__ . '/../partials/end-layout.php'; ?>
