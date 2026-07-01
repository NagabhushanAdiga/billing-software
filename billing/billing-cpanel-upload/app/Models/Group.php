<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use App\Helpers\Id;
use PDO;

final class Group
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public static function findAll(): array
    {
        $pdo = Database::connection();
        $groups = $pdo->query('SELECT * FROM groups ORDER BY name')->fetchAll();
        $subs = $pdo->query('SELECT * FROM subcategories ORDER BY name')->fetchAll();

        $subsByGroup = [];
        foreach ($subs as $sub) {
            $subsByGroup[$sub['group_id']][] = $sub;
        }

        return array_map(
            static fn(array $group): array => self::mapGroup($group, $subsByGroup[$group['id']] ?? []),
            $groups
        );
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function findById(string $id): ?array
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare('SELECT * FROM groups WHERE id = ?');
        $stmt->execute([$id]);
        $group = $stmt->fetch();
        if (!$group) {
            return null;
        }

        $subStmt = $pdo->prepare('SELECT * FROM subcategories WHERE group_id = ? ORDER BY name');
        $subStmt->execute([$id]);
        return self::mapGroup($group, $subStmt->fetchAll());
    }

    public static function create(string $name): array
    {
        $id = Id::createId('grp');
        $stmt = Database::connection()->prepare('INSERT INTO groups (id, name) VALUES (?, ?)');
        $stmt->execute([$id, $name]);
        return ['id' => $id, 'name' => $name, 'subcategories' => []];
    }

    public static function update(string $id, string $name): bool
    {
        $stmt = Database::connection()->prepare('UPDATE groups SET name = ? WHERE id = ?');
        $stmt->execute([$name, $id]);
        return $stmt->rowCount() > 0;
    }

    public static function delete(string $id): void
    {
        $pdo = Database::connection();
        $pdo->prepare('DELETE FROM groups WHERE id = ?')->execute([$id]);
        $pdo->prepare(
            "UPDATE products SET group_id = NULL, subcategory_id = NULL, category = '' WHERE group_id = ?"
        )->execute([$id]);
    }

    public static function addSubcategory(string $groupId, string $name): array
    {
        $id = Id::createId('sub');
        $stmt = Database::connection()->prepare(
            'INSERT INTO subcategories (id, group_id, name) VALUES (?, ?, ?)'
        );
        $stmt->execute([$id, $groupId, $name]);
        return ['id' => $id, 'name' => $name];
    }

    public static function updateSubcategory(string $groupId, string $subcategoryId, string $name): bool
    {
        $stmt = Database::connection()->prepare(
            'UPDATE subcategories SET name = ? WHERE id = ? AND group_id = ?'
        );
        $stmt->execute([$name, $subcategoryId, $groupId]);
        return $stmt->rowCount() > 0;
    }

    public static function deleteSubcategory(string $groupId, string $subcategoryId): void
    {
        $pdo = Database::connection();
        $pdo->prepare('DELETE FROM subcategories WHERE id = ? AND group_id = ?')->execute([$subcategoryId, $groupId]);
        $pdo->prepare('UPDATE products SET subcategory_id = NULL WHERE subcategory_id = ?')->execute([$subcategoryId]);
    }

    public static function nameExists(string $name, ?string $excludeId = null): bool
    {
        if ($excludeId) {
            $stmt = Database::connection()->prepare(
                'SELECT id FROM groups WHERE LOWER(name) = LOWER(?) AND id != ?'
            );
            $stmt->execute([$name, $excludeId]);
        } else {
            $stmt = Database::connection()->prepare('SELECT id FROM groups WHERE LOWER(name) = LOWER(?)');
            $stmt->execute([$name]);
        }

        return (bool) $stmt->fetch();
    }

    public static function deleteAll(): void
    {
        $pdo = Database::connection();
        $pdo->exec('DELETE FROM subcategories');
        $pdo->exec('DELETE FROM groups');
        $pdo->exec("UPDATE products SET group_id = NULL, subcategory_id = NULL, category = ''");
    }

    public static function subcategoryNameExists(string $groupId, string $name, ?string $excludeId = null): bool
    {
        if ($excludeId) {
            $stmt = Database::connection()->prepare(
                'SELECT id FROM subcategories WHERE group_id = ? AND LOWER(name) = LOWER(?) AND id != ?'
            );
            $stmt->execute([$groupId, $name, $excludeId]);
        } else {
            $stmt = Database::connection()->prepare(
                'SELECT id FROM subcategories WHERE group_id = ? AND LOWER(name) = LOWER(?)'
            );
            $stmt->execute([$groupId, $name]);
        }

        return (bool) $stmt->fetch();
    }

    /**
     * @param array<string, mixed> $row
     * @param array<int, array<string, mixed>> $subcategories
     * @return array<string, mixed>
     */
    private static function mapGroup(array $row, array $subcategories): array
    {
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'subcategories' => array_map(
                static fn(array $sub): array => ['id' => $sub['id'], 'name' => $sub['name']],
                $subcategories
            ),
        ];
    }
}
