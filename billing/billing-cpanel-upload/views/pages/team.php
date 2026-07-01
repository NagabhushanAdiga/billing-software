<?php

declare(strict_types=1);

/** @var list<array<string, mixed>> $users */

ob_start();
$title = 'Team';
?>
<div class="flex flex-col gap-6" x-data="{ showForm: false }">
    <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">Team</h1>
            <p class="text-slate-600 text-sm mt-1">Manage staff accounts and roles.</p>
        </div>
        <button type="button" @click="showForm = true" class="btn btn-primary">+ Add member</button>
    </div>

    <div class="card card-accent overflow-hidden">
        <div class="overflow-x-auto">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($users as $member): ?>
                        <tr>
                            <td class="font-semibold"><?= e($member['name'] ?? '') ?></td>
                            <td class="font-mono text-sm"><?= e($member['username'] ?? '') ?></td>
                            <td><span class="badge badge-open"><?= e(role_label($member['role'] ?? '')) ?></span></td>
                            <td class="text-right">
                                <?php if (($member['id'] ?? '') !== ($user['id'] ?? '')): ?>
                                    <form action="<?= base_url('/team/delete') ?>" method="post" class="inline" onsubmit="return confirm('Remove this team member?')">
                                        <input type="hidden" name="id" value="<?= e($member['id'] ?? '') ?>">
                                        <button type="submit" class="text-red-600 font-semibold text-sm hover:underline">Remove</button>
                                    </form>
                                <?php else: ?>
                                    <span class="text-slate-400 text-sm">You</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

    <div x-show="showForm" x-cloak class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div class="card w-full max-w-md p-6">
            <h2 class="text-xl font-bold mb-4">Add team member</h2>
            <form action="<?= base_url('/team/save') ?>" method="post" class="space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Full name *</label>
                    <input type="text" name="name" required class="field-input">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Username *</label>
                    <input type="text" name="username" required class="field-input" autocomplete="off">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Password *</label>
                    <input type="password" name="password" required class="field-input" autocomplete="new-password">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                    <select name="role" class="field-select">
                        <option value="cashier">Cashier</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Administrator</option>
                    </select>
                </div>
                <div class="flex gap-3">
                    <button type="submit" class="btn btn-primary flex-1">Add member</button>
                    <button type="button" @click="showForm = false" class="btn btn-outline">Cancel</button>
                </div>
            </form>
        </div>
    </div>
</div>
<?php require __DIR__ . '/../partials/end-layout.php'; ?>
