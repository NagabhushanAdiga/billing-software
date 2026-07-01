<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Auth;
use App\Core\Database;
use App\Helpers\Id;

final class User
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public static function findAll(): array
    {
        $stmt = Database::connection()->query('SELECT * FROM users ORDER BY name');
        return $stmt->fetchAll();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function findTeamMembers(): array
    {
        $stmt = Database::connection()->query(
            "SELECT * FROM users WHERE role IN ('cashier', 'manager', 'admin') ORDER BY name"
        );
        $rows = $stmt->fetchAll();
        return array_map(static fn(array $row): array => Auth::toPublicUser($row), $rows);
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function findById(string $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function findByUsername(string $username): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT * FROM users WHERE LOWER(username) = LOWER(?)'
        );
        $stmt->execute([trim($username)]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function verifyPassword(array $user, string $password): bool
    {
        return password_verify($password, (string) $user['password_hash']);
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>|null
     */
    public static function create(array $data): ?array
    {
        $id = Id::createId('usr');
        $stmt = Database::connection()->prepare(
            'INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $id,
            strtolower(trim((string) $data['username'])),
            password_hash((string) $data['password'], PASSWORD_DEFAULT),
            (string) $data['name'],
            (string) $data['role'],
        ]);

        return self::findById($id);
    }

    public static function updatePassword(string $id, string $password): void
    {
        $stmt = Database::connection()->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $stmt->execute([password_hash($password, PASSWORD_DEFAULT), $id]);
    }

    public static function delete(string $id): bool
    {
        $stmt = Database::connection()->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
