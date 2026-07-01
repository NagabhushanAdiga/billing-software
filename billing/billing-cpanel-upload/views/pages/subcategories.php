<?php

declare(strict_types=1);

/** @var list<array<string, mixed>> $groups */

ob_start();
$title = 'Subcategories';
?>
<div class="flex flex-col gap-6" x-data="{ showForm: false, editing: null, form: { groupId: '', subcategoryId: '', name: '' }, openAdd() { this.editing = null; this.form = { groupId: '', subcategoryId: '', name: '' }; this.showForm = true; }, openEdit(groupId, sub) { this.editing = sub; this.form = { groupId, subcategoryId: sub.id, name: sub.name }; this.showForm = true; } }">
    <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">Subcategories</h1>
            <p class="text-slate-600 text-sm mt-1">Fine-grained grouping within categories.</p>
        </div>
        <button type="button" @click="openAdd()" class="btn btn-primary" <?= $groups === [] ? 'disabled' : '' ?>>+ Add subcategory</button>
    </div>

    <?php if ($groups === []): ?>
        <div class="card p-8 text-center text-slate-500">Create a <a href="<?= base_url('/categories') ?>" class="text-blue-600 font-semibold">category</a> first.</div>
    <?php else: ?>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <?php foreach ($groups as $group): ?>
                <div class="card card-accent overflow-hidden">
                    <div class="px-5 py-4 border-b border-slate-200 bg-slate-50">
                        <h2 class="font-bold text-slate-900"><?= e($group['name']) ?></h2>
                    </div>
                    <?php $subs = $group['subcategories'] ?? []; ?>
                    <?php if ($subs === []): ?>
                        <p class="px-5 py-6 text-sm text-slate-500">No subcategories in this group.</p>
                    <?php else: ?>
                        <ul class="divide-y divide-slate-100">
                            <?php foreach ($subs as $sub): ?>
                                <li class="px-5 py-3 flex items-center justify-between gap-3">
                                    <span class="font-medium text-slate-800"><?= e($sub['name']) ?></span>
                                    <div class="shrink-0">
                                        <button type="button" @click="openEdit('<?= e($group['id']) ?>', <?= e(json_encode($sub, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT)) ?>)" class="text-blue-600 font-semibold text-sm hover:underline">Edit</button>
                                        <form action="<?= base_url('/subcategories/delete') ?>" method="post" class="inline ml-2" onsubmit="return confirm('Delete subcategory?')">
                                            <input type="hidden" name="groupId" value="<?= e($group['id']) ?>">
                                            <input type="hidden" name="subcategoryId" value="<?= e($sub['id']) ?>">
                                            <button type="submit" class="text-red-600 font-semibold text-sm hover:underline">Delete</button>
                                        </form>
                                    </div>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <div x-show="showForm" x-cloak class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div class="card w-full max-w-md p-6">
            <h2 class="text-xl font-bold mb-4" x-text="editing ? 'Edit subcategory' : 'Add subcategory'"></h2>
            <form action="<?= base_url('/subcategories/save') ?>" method="post" class="space-y-4">
                <input type="hidden" name="subcategoryId" x-model="form.subcategoryId">
                <template x-if="editing">
                    <input type="hidden" name="groupId" x-model="form.groupId">
                </template>
                <template x-if="!editing">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Category *</label>
                        <select name="groupId" class="field-select" x-model="form.groupId">
                            <option value="">Select category</option>
                            <?php foreach ($groups as $group): ?>
                                <option value="<?= e($group['id']) ?>"><?= e($group['name']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </template>
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
