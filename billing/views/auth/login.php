<?php

declare(strict_types=1);

/** @var string|null $error */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign in · SuperMart Billing</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?= base_url('/assets/app.css') ?>">
</head>
<body class="min-h-screen bg-white">
    <div class="min-h-screen flex flex-col lg:flex-row">
        <div class="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-700 text-white">
            <div class="relative flex flex-col justify-between h-full p-10 xl:p-14 overflow-hidden w-full">
                <div class="pointer-events-none absolute inset-0">
                    <div class="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl"></div>
                    <div class="absolute top-1/3 -right-16 w-80 h-80 rounded-full bg-fuchsia-400/20 blur-3xl"></div>
                </div>
                <div class="relative z-10 inline-flex items-center gap-3">
                    <div class="flex items-center justify-center w-12 h-12 rounded-md bg-white/15 backdrop-blur-sm text-white shadow-lg ring-1 ring-white/25">
                        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    </div>
                    <div>
                        <p class="font-extrabold text-xl tracking-tight">SuperMart Billing</p>
                        <p class="text-violet-100 text-sm font-medium">Smart store management</p>
                    </div>
                </div>
                <div class="relative z-10 flex-1 flex flex-col justify-center py-10 max-w-lg">
                    <h1 class="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
                        Run your store with
                        <span class="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-sky-200 to-fuchsia-200">speed and clarity</span>
                    </h1>
                    <p class="mt-4 text-violet-100 text-base leading-relaxed">
                        Everything you need for daily billing — from the counter to reports — in one easy workspace.
                    </p>
                    <ul class="mt-10 space-y-4 text-sm">
                        <li class="flex gap-4"><span class="text-lg">⚡</span><div><p class="font-bold">Fast POS billing</p><p class="text-violet-100/90 mt-0.5">Scan barcodes and print invoices in seconds.</p></div></li>
                        <li class="flex gap-4"><span class="text-lg">📦</span><div><p class="font-bold">Products & inventory</p><p class="text-violet-100/90 mt-0.5">Organize stock with categories.</p></div></li>
                        <li class="flex gap-4"><span class="text-lg">📈</span><div><p class="font-bold">Sales reports</p><p class="text-violet-100/90 mt-0.5">Track revenue and export data.</p></div></li>
                    </ul>
                </div>
                <p class="relative z-10 text-violet-100/90 text-sm">🔒 Secure sign-in for your team</p>
            </div>
        </div>

        <div class="lg:hidden bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 px-6 py-8 text-white">
            <p class="font-extrabold text-xl">SuperMart Billing</p>
            <p class="mt-2 text-violet-100 text-sm">Fast POS billing, inventory, and reports.</p>
        </div>

        <div class="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-white">
            <div class="w-full max-w-md">
                <div class="mb-8">
                    <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
                    <p class="text-slate-500 mt-2 text-sm sm:text-base">Sign in to open the dashboard and start billing.</p>
                </div>

                <div class="rounded-md border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/60 ring-1 ring-slate-100">
                    <?php if (!empty($error)): ?>
                        <div class="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 font-medium">
                            <?= e($error) ?>
                        </div>
                    <?php endif; ?>

                    <form action="<?= base_url('/login') ?>" method="post" class="space-y-5">
                        <div>
                            <label for="username" class="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
                            <input type="text" id="username" name="username" required autocomplete="username" class="field-input" placeholder="Enter username">
                        </div>
                        <div>
                            <label for="password" class="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                            <input type="password" id="password" name="password" required autocomplete="current-password" class="field-input" placeholder="Enter password">
                        </div>
                        <button type="submit" class="btn btn-primary w-full py-3 text-base">Sign in</button>
                    </form>
                </div>

                <p class="text-center text-xs text-slate-400 mt-6">© <?= date('Y') ?> SuperMart Billing · Built for retail teams</p>
            </div>
        </div>
    </div>
</body>
</html>
