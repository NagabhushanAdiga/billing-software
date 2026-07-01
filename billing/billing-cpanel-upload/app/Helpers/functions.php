<?php

declare(strict_types=1);

if (!function_exists('app_config')) {
    function app_config(): array
    {
        static $config = null;
        if ($config === null) {
            $config = require dirname(__DIR__, 2) . '/config/app.php';
        }
        return $config;
    }
}

if (!function_exists('base_url')) {
    function base_url(string $path = ''): string
    {
        $base = app_config()['base_path'] ?? '';
        if ($path === '' || $path === '/') {
            return $base === '' ? '/' : $base;
        }
        return $base . '/' . ltrim($path, '/');
    }
}

if (!function_exists('e')) {
    function e(mixed $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }
}

if (!function_exists('money')) {
    function money(float|int|string $amount, string $currency = '₹'): string
    {
        return $currency . number_format((float) $amount, 2);
    }
}

if (!function_exists('role_label')) {
    function role_label(?string $role): string
    {
        return match ($role) {
            'admin' => 'Administrator',
            'manager' => 'Manager',
            'cashier' => 'Cashier',
            default => ucfirst((string) $role),
        };
    }
}

if (!function_exists('nav_icon')) {
    function nav_icon(string $icon): string
    {
        return match ($icon) {
            'grid' => '📊',
            'cart' => '🛒',
            'receipt' => '🧾',
            'cube' => '📦',
            'collection' => '🗂️',
            'tag' => '🏷️',
            'qrcode' => '▦',
            'chart' => '📈',
            'users' => '👥',
            'cog' => '⚙️',
            'clipboard' => '📋',
            'support' => '💬',
            default => '•',
        };
    }
}

if (!function_exists('format_date')) {
    function format_date(?string $iso): string
    {
        if ($iso === null || $iso === '') {
            return '';
        }
        $ts = strtotime($iso);
        return $ts ? date('d M Y, h:i A', $ts) : $iso;
    }
}
