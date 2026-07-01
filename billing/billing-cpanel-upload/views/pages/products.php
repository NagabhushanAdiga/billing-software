<?php

declare(strict_types=1);

/** @var list<array<string, mixed>> $products */
/** @var list<array<string, mixed>> $groups */

ob_start();
$title = 'Products';
?>
<div class="flex flex-col gap-6" x-data="{
    showForm: false,
    form: { id: '', barcode: '', name: '', groupId: '', subcategoryId: '', price: 0, stock: 0, discount: 0, gst: '', hsn: '', image: '' },
    openAdd() {
        this.form = { id: '', barcode: '', name: '', groupId: '', subcategoryId: '', price: 0, stock: 0, discount: 0, gst: '', hsn: '', image: '' };
        this.showForm = true;
    },
    openEdit(p) {
        this.form = {
            id: p.id || '',
            barcode: p.barcode || '',
            name: p.name || '',
            groupId: p.groupId || '',
            subcategoryId: p.subcategoryId || '',
            price: p.price ?? 0,
            stock: p.stock ?? 0,
            discount: p.discount ?? 0,
            gst: p.gst ?? '',
            hsn: p.hsn || '',
            image: p.image || ''
        };
        this.showForm = true;
    }
}">
    <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">Products</h1>
            <p class="text-slate-600 text-sm mt-1">Manage inventory, barcodes, and pricing.</p>
        </div>
        <button type="button" @click="openAdd()" class="btn btn-primary">
            <span>+</span> Add product
        </button>
    </div>

    <div class="card card-accent overflow-hidden">
        <?php if ($products === []): ?>
            <div class="px-5 py-16 text-center text-slate-500">No products yet. Add your first product above.</div>
        <?php else: ?>
            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Barcode</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th class="text-right">Price</th>
                            <th class="text-right">Stock</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($products as $product): ?>
                            <tr>
                                <td class="font-mono text-sm"><?= e($product['barcode'] ?? '') ?></td>
                                <td class="font-semibold"><?= e($product['name'] ?? '') ?></td>
                                <td><?= e($product['category'] ?? '—') ?></td>
                                <td class="text-right"><?= e(money((float) ($product['price'] ?? 0), $currency)) ?></td>
                                <td class="text-right"><?= e((string) ($product['stock'] ?? 0)) ?></td>
                                <td class="text-right whitespace-nowrap">
                                    <button type="button" @click="openEdit(<?= e(json_encode($product, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT)) ?>)" class="text-blue-600 font-semibold text-sm hover:underline">Edit</button>
                                    <form action="<?= base_url('/products/delete') ?>" method="post" class="inline ml-2" onsubmit="return confirm('Delete this product?')">
                                        <input type="hidden" name="id" value="<?= e($product['id'] ?? '') ?>">
                                        <button type="submit" class="text-red-600 font-semibold text-sm hover:underline">Delete</button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>

    <div x-show="showForm" x-cloak class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" @keydown.escape.window="showForm = false">
        <div class="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" @click.outside="showForm = false">
            <h2 class="text-xl font-bold text-slate-900 mb-4" x-text="form.id ? 'Edit product' : 'Add product'"></h2>
            <form action="<?= base_url('/products/save') ?>" method="post" class="space-y-4">
                <input type="hidden" name="id" x-model="form.id">
                <input type="hidden" name="subcategoryId" x-model="form.subcategoryId">
                <input type="hidden" name="image" x-model="form.image">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Barcode *</label>
                    <input type="text" name="barcode" required class="field-input" x-model="form.barcode">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Name *</label>
                    <input type="text" name="name" required class="field-input" x-model="form.name">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                        <select name="groupId" class="field-select" x-model="form.groupId">
                            <option value="">— None —</option>
                            <?php foreach ($groups as $group): ?>
                                <option value="<?= e($group['id']) ?>"><?= e($group['name']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Price</label>
                        <input type="number" name="price" step="0.01" min="0" class="field-input" x-model="form.price">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Stock</label>
                        <input type="number" name="stock" step="0.001" min="0" class="field-input" x-model="form.stock">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">GST %</label>
                        <input type="number" name="gst" step="0.01" min="0" class="field-input" x-model="form.gst">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">HSN</label>
                        <input type="text" name="hsn" class="field-input" x-model="form.hsn">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Discount</label>
                        <input type="number" name="discount" step="0.01" min="0" class="field-input" x-model="form.discount">
                    </div>
                </div>
                <div class="flex gap-3 pt-2">
                    <button type="submit" class="btn btn-primary flex-1">Save product</button>
                    <button type="button" @click="showForm = false" class="btn btn-outline">Cancel</button>
                </div>
            </form>
        </div>
    </div>
</div>
<?php require __DIR__ . '/../partials/end-layout.php'; ?>
