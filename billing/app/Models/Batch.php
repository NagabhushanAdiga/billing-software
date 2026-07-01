<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use App\Helpers\Id;

final class Batch
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public static function findAll(): array
    {
        return Database::connection()->query('SELECT id, name FROM batches ORDER BY name')->fetchAll();
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function findById(string $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT id, name FROM batches WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public static function create(string $name): array
    {
        $id = Id::createId('bat');
        $stmt = Database::connection()->prepare('INSERT INTO batches (id, name) VALUES (?, ?)');
        $stmt->execute([$id, $name]);
        return ['id' => $id, 'name' => $name];
    }

    public static function delete(string $id): void
    {
        $pdo = Database::connection();
        $pdo->prepare('DELETE FROM batches WHERE id = ?')->execute([$id]);
        $stmt = $pdo->prepare("UPDATE products SET batch = '' WHERE batch LIKE ?");
        $stmt->execute(['%' . $id . '%']);
    }

    public static function deleteAll(): void
    {
        $pdo = Database::connection();
        $pdo->exec('DELETE FROM batches');
        $pdo->exec("UPDATE products SET batch = ''");
    }

    public static function nameExists(string $name): bool
    {
        $stmt = Database::connection()->prepare('SELECT id FROM batches WHERE LOWER(name) = LOWER(?)');
        $stmt->execute([$name]);
        return (bool) $stmt->fetch();
    }
}
