<?php

declare(strict_types=1);

/** @var string $content */
/** @var string $title */
/** @var array<string, mixed>|null $user */
/** @var string $currentPath */
/** @var list<array<string, mixed>> $navItems */
/** @var array<string, mixed> $settings */
/** @var array{type: string, message: string}|null $flash */

$title = $title ?? 'Billing';
$storeName = $settings['storeName'] ?? 'SuperMart Billing';
$mainNav = array_values(array_filter($navItems, static fn(array $i): bool => empty($i['bottom'])));
$bottomNav = array_values(array_filter($navItems, static fn(array $i): bool => !empty($i['bottom'])));
$userInitial = strtoupper(substr((string) ($user['name'] ?? 'U'), 0, 1));
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($title) ?> · <?= e($storeName) ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?= base_url('/assets/app.css') ?>">
</head>
<body class="h-screen overflow-hidden bg-white" x-data="{ sidebarOpen: false }">
<script>window.__APP_BASE__=<?= json_encode(app_config()['base_path'], JSON_THROW_ON_ERROR) ?>;</script>
    <div class="h-full flex flex-col overflow-hidden">
        <header class="no-print h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200 shrink-0 z-20 relative">
            <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-sky-500 via-50% to-fuchsia-500"></div>
            <div class="flex items-center gap-3 min-w-0">
                <button type="button" @click="sidebarOpen = !sidebarOpen" class="lg:hidden p-2 -ml-1 rounded-md text-violet-700 hover:bg-violet-100 transition-colors" aria-label="Toggle menu">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                </button>
                <div class="flex items-center gap-2.5 min-w-0">
                    <span class="flex items-center justify-center w-10 h-10 rounded-md bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/30 shrink-0">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    </span>
                    <div class="min-w-0">
                        <span class="block text-base sm:text-lg font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent truncate leading-tight"><?= e($storeName) ?></span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2 sm:gap-3 shrink-0">
                <div class="flex items-center gap-2.5 min-w-0">
                    <span class="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white text-sm font-bold shrink-0"><?= e($userInitial) ?></span>
                    <div class="min-w-0 hidden sm:block">
                        <span class="block text-sm font-semibold text-slate-800 truncate max-w-[200px] leading-tight"><?= e($user['name'] ?? '') ?></span>
                        <span class="block text-xs font-medium text-slate-500 truncate max-w-[200px] leading-tight mt-0.5"><?= e(role_label($user['role'] ?? '')) ?></span>
                    </div>
                </div>
                <form action="<?= base_url('/logout') ?>" method="post" class="inline">
                    <button type="submit" class="btn btn-outline !text-red-600 !border-red-200 hover:!bg-red-50 hover:!border-red-300 text-sm">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                        <span class="hidden sm:inline">Logout</span>
                    </button>
                </form>
            </div>
        </header>

        <div class="flex flex-1 min-h-0 overflow-hidden relative">
            <aside
                class="no-print fixed lg:static inset-y-0 left-0 z-40 h-full w-72 shrink-0 flex flex-col py-5 overflow-hidden transform transition-transform duration-300 ease-out shadow-2xl lg:shadow-none bg-gradient-to-b from-indigo-950 via-violet-950 to-fuchsia-950 border-r border-white/10"
                :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
            >
                <div class="px-4 mb-4 hidden lg:block shrink-0">
                    <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300/70">Menu</p>
                </div>
                <nav class="flex flex-col flex-1 min-h-0 px-3 w-full">
                    <div class="flex flex-col gap-1.5 overflow-y-auto flex-1 min-h-0">
                        <?php foreach ($mainNav as $idx => $item): ?>
                            <?php $active = ($currentPath === $item['path']); ?>
                            <a href="<?= e(base_url($item['path'])) ?>"
                               class="w-full group flex items-center gap-3 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 <?= $active ? 'bg-blue-600 text-white scale-[1.02]' : 'text-violet-200/80 hover:text-white hover:bg-white/10' ?>">
                                <span class="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 <?= $active ? 'bg-white/25' : 'bg-white/10' ?>">
                                    <span class="text-base leading-none"><?= nav_icon((string) ($item['icon'] ?? '')) ?></span>
                                </span>
                                <span class="flex-1 truncate"><?= e($item['label']) ?></span>
                            </a>
                        <?php endforeach; ?>
                    </div>
                    <?php if ($bottomNav !== []): ?>
                        <div class="shrink-0 pt-3 mt-2 border-t border-white/10 flex flex-col gap-1.5">
                            <?php foreach ($bottomNav as $item): ?>
                                <?php $active = ($currentPath === $item['path']); ?>
                                <a href="<?= e(base_url($item['path'])) ?>"
                                   class="w-full group flex items-center gap-3 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200 <?= $active ? 'bg-blue-600 text-white' : 'text-violet-200/80 hover:text-white hover:bg-white/10' ?>">
                                    <span class="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 <?= $active ? 'bg-white/25' : 'bg-white/10' ?>">
                                        <span class="text-base leading-none"><?= nav_icon((string) ($item['icon'] ?? '')) ?></span>
                                    </span>
                                    <span class="flex-1 truncate"><?= e($item['label']) ?></span>
                                </a>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </nav>
            </aside>

            <div x-show="sidebarOpen" @click="sidebarOpen = false" class="no-print fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden" x-cloak></div>

            <main class="flex-1 min-w-0 h-full overflow-auto p-4 sm:p-6 lg:p-8 bg-white">
                <?php if (!empty($flash['message'])): ?>
                    <div class="no-print mb-4 rounded-md px-4 py-3 text-sm font-medium border <?= ($flash['type'] ?? '') === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200' ?>">
                        <?= e($flash['message']) ?>
                    </div>
                <?php endif; ?>
                <?= $content ?>
            </main>
        </div>
    </div>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js"></script>
    <style>[x-cloak]{display:none!important}</style>
</body>
</html>
