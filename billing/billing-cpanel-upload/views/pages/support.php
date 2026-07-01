<?php

declare(strict_types=1);

/** @var list<array<string, mixed>> $tickets */

ob_start();
$title = 'Support';
?>
<div class="flex flex-col gap-6" x-data="{ showForm: false }">
    <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">Support</h1>
            <p class="text-slate-600 text-sm mt-1">Raise tickets and track their status.</p>
        </div>
        <button type="button" @click="showForm = true" class="btn btn-primary">+ Raise ticket</button>
    </div>

    <div class="card card-accent overflow-hidden">
        <?php if ($tickets === []): ?>
            <div class="px-5 py-16 text-center text-slate-500">No support tickets yet.</div>
        <?php else: ?>
            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Ticket</th>
                            <th>Subject</th>
                            <th>Category</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($tickets as $ticket): ?>
                            <?php
                            $status = $ticket['status'] ?? 'open';
                            $badgeClass = match ($status) {
                                'resolved' => 'badge-resolved',
                                'in-progress' => 'badge-progress',
                                default => 'badge-open',
                            };
                            ?>
                            <tr>
                                <td class="font-mono text-sm font-semibold"><?= e($ticket['ticketNo'] ?? $ticket['id'] ?? '') ?></td>
                                <td>
                                    <p class="font-semibold text-slate-900"><?= e($ticket['subject'] ?? '') ?></p>
                                    <p class="text-xs text-slate-500 truncate max-w-xs"><?= e($ticket['description'] ?? '') ?></p>
                                </td>
                                <td><?= e($ticket['category'] ?? '') ?></td>
                                <td><?= e(ucfirst($ticket['priority'] ?? '')) ?></td>
                                <td><span class="badge <?= $badgeClass ?>"><?= e(ucfirst(str_replace('-', ' ', $status))) ?></span></td>
                                <td class="text-sm whitespace-nowrap"><?= e(format_date($ticket['createdAt'] ?? '')) ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>

    <div x-show="showForm" x-cloak class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div class="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 class="text-xl font-bold mb-4">Raise support ticket</h2>
            <form action="<?= base_url('/support/save') ?>" method="post" class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Subject *</label>
                    <input type="text" name="subject" required class="field-input">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Description *</label>
                    <textarea name="description" required rows="4" class="field-input"></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                        <select name="category" class="field-select">
                            <option value="general">General</option>
                            <option value="billing">Billing</option>
                            <option value="inventory">Inventory</option>
                            <option value="technical">Technical</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1">Priority</label>
                        <select name="priority" class="field-select">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
                <div class="flex gap-3">
                    <button type="submit" class="btn btn-primary flex-1">Submit ticket</button>
                    <button type="button" @click="showForm = false" class="btn btn-outline">Cancel</button>
                </div>
            </form>
        </div>
    </div>
</div>
<?php require __DIR__ . '/../partials/end-layout.php'; ?>
