<?php

declare(strict_types=1);

/** @var list<array<string, mixed>> $entries */

ob_start();
$title = 'Audit log';
?>
<div class="flex flex-col gap-6">
    <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">Audit log</h1>
        <p class="text-slate-600 text-sm mt-1">Track important actions across the store.</p>
    </div>

    <div class="card card-accent overflow-hidden">
        <?php if ($entries === []): ?>
            <div class="px-5 py-16 text-center text-slate-500">No audit entries yet.</div>
        <?php else: ?>
            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>When</th>
                            <th>Action</th>
                            <th>Category</th>
                            <th>Details</th>
                            <th>Actor</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($entries as $entry): ?>
                            <?php $actor = $entry['actor'] ?? []; ?>
                            <tr>
                                <td class="whitespace-nowrap text-sm"><?= e(format_date($entry['at'] ?? '')) ?></td>
                                <td><span class="font-semibold text-slate-900"><?= e($entry['action'] ?? '') ?></span></td>
                                <td><span class="badge badge-open"><?= e($entry['category'] ?? '') ?></span></td>
                                <td class="max-w-xs truncate"><?= e($entry['details'] ?? '') ?></td>
                                <td><?= e($actor['name'] ?? $actor['username'] ?? '—') ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>
<?php require __DIR__ . '/../partials/end-layout.php'; ?>
