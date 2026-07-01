<?php

declare(strict_types=1);

namespace App\Helpers;

use App\Core\Auth;
use App\Core\View;

final class Web
{
    /**
     * @param array<string, mixed> $data
     * @return array{status: int, body: string, headers: array<string, string>}
     */
    public static function page(string $view, array $data = [], int $status = 200): array
    {
        return [
            'status' => $status,
            'body' => View::render($view, $data),
            'headers' => ['Content-Type' => 'text/html; charset=UTF-8'],
        ];
    }

    /**
     * @return array{status: int, body: null, headers: array<string, string>}|null
     */
    public static function guard(): ?array
    {
        if (!Auth::check()) {
            return self::redirect('/login');
        }
        return null;
    }

    /**
     * @param string|string[] $roles
     * @return array{status: int, body: null, headers: array<string, string>}|null
     */
    public static function guardRole(string|array $roles): ?array
    {
        $blocked = self::guard();
        if ($blocked !== null) {
            return $blocked;
        }
        if (!Auth::hasRole($roles)) {
            return self::redirect('/');
        }
        return null;
    }

    /**
     * @return array{status: int, body: null, headers: array<string, string>}
     */
    public static function redirect(string $url): array
    {
        if (!str_starts_with($url, 'http://') && !str_starts_with($url, 'https://')) {
            $url = base_url($url);
        }
        return [
            'status' => 302,
            'body' => null,
            'headers' => ['Location' => $url],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function navForUser(): array
    {
        $user = Auth::user();
        $role = $user['role'] ?? '';
        $items = require dirname(__DIR__, 2) . '/config/nav.php';
        return array_values(array_filter($items, static fn(array $item): bool => in_array($role, $item['roles'], true)));
    }

    public static function canAccess(string $path): bool
    {
        $user = Auth::user();
        if ($user === null) {
            return false;
        }
        if ($path === '/' || $path === '') {
            return true;
        }
        $items = require dirname(__DIR__, 2) . '/config/nav.php';
        foreach ($items as $item) {
            if ($item['path'] === $path) {
                return in_array($user['role'] ?? '', $item['roles'], true);
            }
        }
        return false;
    }

    /**
     * @param array<string, mixed> $extra
     * @return array<string, mixed>
     */
    public static function layoutData(string $currentPath, array $extra = []): array
    {
        $settings = \App\Models\Settings::get();
        return array_merge([
            'user' => Auth::user(),
            'currentPath' => $currentPath,
            'navItems' => self::navForUser(),
            'settings' => $settings,
            'currency' => $settings['currency'] ?? '₹',
            'flash' => self::pullFlash(),
        ], $extra);
    }

    public static function flash(string $type, string $message): void
    {
        $_SESSION['flash'] = ['type' => $type, 'message' => $message];
    }

    public static function pullFlash(): ?array
    {
        $flash = $_SESSION['flash'] ?? null;
        unset($_SESSION['flash']);
        return is_array($flash) ? $flash : null;
    }
}
