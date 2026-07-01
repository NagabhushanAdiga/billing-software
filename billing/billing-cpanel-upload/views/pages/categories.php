<?php

declare(strict_types=1);

/** @var list<array<string, mixed>> $groups */

ob_start();
$title = 'Categories';
?>
<div class="flex flex-col gap-6" x-data="{ showForm: false, editing: null, form: { id: '', name: '' }, openAdd() { this.editing = null; this.form = { id: '', name: '' }; this.showForm = true; }, openEdit(g) { this.editing = g; this.form = { id: g.id, name: g.name }; this.showForm = true; } }">
    <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">Categories</h1>
            <p class="text-slate-600 text-sm mt-1">Organize products into top-level groups.</p>
        </div>
        <button type="button" @click="openAdd()" class="btn btn-primary">+ Add category</button>
    </div>

    <div class="card card-accent overflow-hidden">
        <?php if ($groups === []): ?>
            <div class="px-5 py-16 text-center text-slate-500">No categories yet.</div>
        <?php else: ?>
            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Subcategories</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($groups as $group): ?>
                            <tr>
                                <td class="font-semibold text-slate-900"><?= e($group['name']) ?></td>
                                <td><?= count($group['subcategories'] ?? []) ?></td>
                                <td class="text-right whitespace-nowrap">
                                    <button type="button" @click="openEdit(<?= e(json_encode($group, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT)) ?>)" class="text-blue-600 font-semibold text-sm hover:underline">Edit</button>
                                    <form action="<?= base_url('/categories/delete') ?>" method="post" class="inline ml-2" onsubmit="return confirm('Delete this category?')">
                                        <input type="hidden" name="id" value="<?= e($group['id']) ?>">
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

    <div x-show="showForm" x-cloak class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div class="card w-full max-w-md p-6">
            <h2 class="text-xl font-bold mb-4" x-text="editing ? 'Edit category' : 'Add category'"></h2>
            <form action="<?= base_url('/categories/save') ?>" method="post" class="space-y-4">
                <input type="hidden" name="id" x-model="form.id">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Name *</label>
                    <input type="text" name="name" required class="field-input" x-model="form.name">
                </div>
                <div class="flex gap-3">
                    <button type="submit" class="btn btn-primary flex-1">Save</button>
                    <button type="button" @click="showForm = false" class="btn btn-outline">Cancel</button>
                </div>
            </form>
        </div>
    </div>
</div>
<?php require __DIR__ . '/../partials/end-layout.php'; ?>
