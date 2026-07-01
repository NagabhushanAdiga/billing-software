<?php

declare(strict_types=1);

/** @var string $productsJson */
/** @var string $settingsJson */

ob_start();
$title = 'POS / Billing';
?>
<div x-data="posApp" x-init="init()" class="flex flex-col gap-6">
    <script type="application/json" data-products><?= $productsJson ?></script>
    <script type="application/json" data-settings><?= $settingsJson ?></script>
    <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">POS / Billing</h1>
            <p class="text-slate-600 text-sm mt-1">Scan barcodes or search products to build a bill.</p>
        </div>
        <button type="button" @click="clearCart()" class="btn btn-outline text-sm" :disabled="!cart.length">Clear bill</button>
    </div>

    <div x-show="message" x-cloak
         :class="messageType === 'error' ? 'bg-red-50 text-red-800 border-red-200' : (messageType === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-blue-50 text-blue-800 border-blue-200')"
         class="rounded-md border px-4 py-3 text-sm font-medium" x-text="message"></div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div class="xl:col-span-2 space-y-4">
            <div class="card card-accent p-5">
                <label class="block text-sm font-semibold text-slate-700 mb-2">Barcode / Search</label>
                <div class="barcode-input">
                    <form @submit.prevent="onBarcodeSubmit()" class="flex gap-2">
                        <input type="text" x-ref="barcodeInput" x-model="barcode" @input="searchQuery = barcode" class="field-input flex-1" placeholder="Scan barcode or type to search…" autocomplete="off">
                        <button type="submit" class="btn btn-primary shrink-0">Add</button>
                    </form>
                </div>
                <div x-show="filteredProducts().length" class="mt-3 border border-slate-200 rounded-md overflow-hidden divide-y divide-slate-100">
                    <template x-for="product in filteredProducts()" :key="product.id">
                        <button type="button" @click="addProduct(product)" class="w-full text-left px-4 py-3 hover:bg-violet-50 flex items-center justify-between gap-3">
                            <div>
                                <p class="font-semibold text-slate-900" x-text="product.name"></p>
                                <p class="text-xs text-slate-500"><span x-text="product.barcode"></span> · Stock: <span x-text="getProductStock(product)"></span></p>
                            </div>
                            <span class="font-bold text-blue-600" x-text="formatMoney(product.price)"></span>
                        </button>
                    </template>
                </div>
            </div>

            <div class="card card-accent overflow-hidden">
                <div class="px-5 py-4 border-b border-slate-200">
                    <h2 class="text-lg font-bold text-slate-900">Cart <span class="text-slate-500 font-normal text-sm" x-text="'(' + cart.length + ' items)'"></span></h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="data-table" x-show="cart.length">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Qty</th>
                                <th class="text-right">Total</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <template x-for="(item, index) in cart" :key="item.barcode + '-' + index">
                                <tr>
                                    <td>
                                        <p class="font-semibold text-slate-900" x-text="item.name"></p>
                                        <p class="text-xs text-slate-500" x-text="item.barcode"></p>
                                    </td>
                                    <td x-text="formatMoney(item.price)"></td>
                                    <td>
                                        <div class="inline-flex items-center gap-1">
                                            <button type="button" @click="updateQty(index, -1)" class="w-8 h-8 rounded border border-slate-200 hover:bg-slate-50">−</button>
                                            <span class="w-10 text-center font-semibold" x-text="item.qty"></span>
                                            <button type="button" @click="updateQty(index, 1)" class="w-8 h-8 rounded border border-slate-200 hover:bg-slate-50">+</button>
                                        </div>
                                    </td>
                                    <td class="text-right font-semibold" x-text="formatMoney(lineGross(item))"></td>
                                    <td>
                                        <button type="button" @click="removeItem(index)" class="text-red-600 hover:text-red-800 text-sm font-semibold">Remove</button>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                    <div x-show="!cart.length" class="px-5 py-12 text-center text-slate-500 text-sm">
                        Cart is empty — scan a barcode or search for products.
                    </div>
                </div>
            </div>
        </div>

        <div class="space-y-4">
            <div class="card card-accent p-5 sticky top-4">
                <h2 class="text-lg font-bold text-slate-900 mb-4">Bill summary</h2>
                <dl class="space-y-2 text-sm">
                    <div class="flex justify-between"><dt class="text-slate-600">Gross subtotal</dt><dd class="font-semibold" x-text="formatMoney(totals().grossSubtotal)"></dd></div>
                    <div class="flex justify-between"><dt class="text-slate-600">Tax (incl.)</dt><dd class="font-semibold" x-text="formatMoney(totals().tax)"></dd></div>
                    <div class="flex justify-between pt-3 border-t border-slate-200 text-base">
                        <dt class="font-bold text-slate-900">Total</dt>
                        <dd class="font-extrabold text-violet-700 text-xl" x-text="formatMoney(totals().total)"></dd>
                    </div>
                </dl>
                <button type="button" @click="checkout()" :disabled="!cart.length || loading" class="btn btn-primary w-full mt-6 py-3 text-base">
                    <span x-show="!loading">Checkout &amp; Print</span>
                    <span x-show="loading">Processing…</span>
                </button>
            </div>
        </div>
    </div>
</div>

<script>window.__APP_BASE__=<?= json_encode(app_config()['base_path'], JSON_THROW_ON_ERROR) ?>;</script>
<script src="<?= base_url('/assets/pos.js') ?>"></script>
<?php require __DIR__ . '/../partials/end-layout.php'; ?>
