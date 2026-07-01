<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use App\Helpers\Id;

final class AuditLog
{
    private const MAX_ENTRIES = 1000;

    /**
     * @param array<string, mixed> $options
     * @return array<int, array<string, mixed>>
     */
    public static function findAll(array $options = []): array
    {
        $category = $options['category'] ?? null;
        $limit = (int) ($options['limit'] ?? self::MAX_ENTRIES);

        $sql = 'SELECT * FROM audit_log';
        $params = [];

        if ($category) {
            $sql .= ' WHERE category = ?';
            $params[] = $category;
        }

        $sql .= ' ORDER BY at DESC LIMIT ?';
        $params[] = $limit;

        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        return array_map(static fn(array $row): array => self::mapEntry($row), $rows);
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public static function create(array $data): array
    {
        $id = Id::createId('aud');
        $at = (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s');
        $actor = $data['actor'] ?? null;

        $stmt = Database::connection()->prepare(
            'INSERT INTO audit_log (id, at, action, category, details, actor_json) VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $id,
            $at,
            (string) $data['action'],
            (string) ($data['category'] ?? 'system'),
            (string) ($data['details'] ?? ''),
            $actor ? json_encode($actor, JSON_THROW_ON_ERROR) : null,
        ]);

        return [
            'id' => $id,
            'at' => $at,
            'action' => (string) $data['action'],
            'category' => (string) ($data['category'] ?? 'system'),
            'details' => (string) ($data['details'] ?? ''),
            'actor' => $actor,
        ];
    }

    public static function clear(): void
    {
        Database::connection()->exec('DELETE FROM audit_log');
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private static function mapEntry(array $row): array
    {
        return [
            'id' => $row['id'],
            'at' => self::formatIso($row['at']),
            'action' => $row['action'],
            'category' => $row['category'],
            'details' => $row['details'],
            'actor' => self::parseJson($row['actor_json'] ?? null),
        ];
    }

    private static function formatIso(string $datetime): string
    {
        return (new \DateTimeImmutable($datetime))->format(DATE_ATOM);
    }

    private static function parseJson(mixed $value): mixed
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_array($value)) {
            return $value;
        }

        try {
            return json_decode((string) $value, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }
    }
}
