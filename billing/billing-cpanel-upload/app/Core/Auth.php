<?php

declare(strict_types=1);

namespace App\Core;

use App\Models\User;

final class Auth
{
    private const SESSION_USER_KEY = 'auth_user';

    public static function attempt(string $username, string $password): bool
    {
        $user = User::findByUsername($username);
        if ($user === null) {
            return false;
        }

        if (!password_verify($password, (string) $user['password_hash'])) {
            return false;
        }

        self::login(self::toPublicUser($user));
        return true;
    }

    /**
     * @param array<string, mixed> $publicUser
     */
    public static function login(array $publicUser): void
    {
        $_SESSION[self::SESSION_USER_KEY] = $publicUser;
    }

    public static function logout(): void
    {
        unset($_SESSION[self::SESSION_USER_KEY]);
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function user(): ?array
    {
        $user = $_SESSION[self::SESSION_USER_KEY] ?? null;
        return is_array($user) ? $user : null;
    }

    public static function check(): bool
    {
        return self::user() !== null;
    }

    public static function isAdmin(): bool
    {
        $user = self::user();
        return ($user['role'] ?? '') === 'admin';
    }

  /**
   * @param string|string[] $roles
   */
    public static function hasRole(string|array $roles): bool
    {
        $user = self::user();
        if ($user === null) {
            return false;
        }

        $allowed = is_array($roles) ? $roles : [$roles];
        return in_array($user['role'] ?? '', $allowed, true);
    }

    /**
     * @return callable(array): ?array
     */
    public static function requireAuth(): callable
    {
        return static function (): ?array {
            if (!self::check()) {
                return self::jsonError('Authentication required', 401);
            }
            return null;
        };
    }

    /**
     * @return callable(array): ?array
     */
    public static function requireAdmin(): callable
    {
        return static function (): ?array {
            if (!self::check()) {
                return self::jsonError('Authentication required', 401);
            }
            if (!self::isAdmin()) {
                return self::jsonError('Forbidden', 403);
            }
            return null;
        };
    }

    /**
     * @param string|string[] $roles
     * @return callable(array): ?array
     */
    public static function requireRole(string|array $roles): callable
    {
        return static function () use ($roles): ?array {
            if (!self::check()) {
                return self::jsonError('Authentication required', 401);
            }
            if (!self::hasRole($roles)) {
                return self::jsonError('Forbidden', 403);
            }
            return null;
        };
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    public static function toPublicUser(array $row): array
    {
        return [
            'id' => $row['id'],
            'username' => $row['username'],
            'name' => $row['name'],
            'role' => $row['role'],
        ];
    }

    /**
     * @return array{status: int, body: array<string, mixed>, headers: array<string, string>}
     */
    private static function jsonError(string $message, int $status): array
    {
        return [
            'status' => $status,
            'body' => ['ok' => false, 'error' => $message],
            'headers' => ['Content-Type' => 'application/json'],
        ];
    }
}
