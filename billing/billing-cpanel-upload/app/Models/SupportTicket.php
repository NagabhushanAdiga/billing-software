<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use App\Helpers\Id;

final class SupportTicket
{
    /**
     * @param array<string, mixed> $options
     * @return array<int, array<string, mixed>>
     */
    public static function findAll(array $options = []): array
    {
        $sql = 'SELECT * FROM support_tickets';
        $params = [];

        $status = $options['status'] ?? null;
        if ($status && $status !== 'all') {
            $sql .= ' WHERE status = ?';
            $params[] = $status;
        }

        $sql .= ' ORDER BY created_at DESC';

        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        return array_map(static fn(array $row): array => self::mapTicket($row), $rows);
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function findById(string $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM support_tickets WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? self::mapTicket($row) : null;
    }

    /**
     * @param array<string, mixed> $data
     * @param array<string, mixed>|null $actor
     * @return array<string, mixed>
     */
    public static function create(array $data, ?array $actor = null): array
    {
        $id = Id::createId('tkt');
        $ticketNo = self::nextTicketNo();
        $now = (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s');

        $stmt = Database::connection()->prepare(
            'INSERT INTO support_tickets (
                id, ticket_no, subject, description, category, priority, status,
                created_by_id, created_by_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $id,
            $ticketNo,
            (string) $data['subject'],
            (string) $data['description'],
            (string) ($data['category'] ?? 'billing'),
            (string) ($data['priority'] ?? 'medium'),
            'open',
            $actor['id'] ?? null,
            $actor ? json_encode($actor, JSON_THROW_ON_ERROR) : null,
            $now,
        ]);

        return self::findById($id) ?? [
            'id' => $id,
            'ticketNo' => $ticketNo,
            'subject' => $data['subject'],
            'description' => $data['description'],
            'category' => $data['category'] ?? 'billing',
            'priority' => $data['priority'] ?? 'medium',
            'status' => 'open',
            'createdAt' => (new \DateTimeImmutable($now))->format(DATE_ATOM),
        ];
    }

    public static function updateStatus(string $id, string $status): bool
    {
        $now = (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s');
        $stmt = Database::connection()->prepare(
            'UPDATE support_tickets SET status = ?, updated_at = ? WHERE id = ?'
        );
        $stmt->execute([$status, $now, $id]);
        return $stmt->rowCount() > 0;
    }

  /**
   * @param array<string, mixed> $updates
   */
    public static function update(string $id, array $updates): bool
    {
        $fields = [];
        $params = [];

        $map = [
            'subject' => 'subject',
            'description' => 'description',
            'category' => 'category',
            'priority' => 'priority',
            'status' => 'status',
        ];

        foreach ($map as $key => $column) {
            if (array_key_exists($key, $updates)) {
                $fields[] = $column . ' = ?';
                $params[] = $updates[$key];
            }
        }

        if ($fields === []) {
            return false;
        }

        $fields[] = 'updated_at = ?';
        $params[] = (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s');
        $params[] = $id;

        $sql = 'UPDATE support_tickets SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($params);

        return $stmt->rowCount() > 0;
    }

    public static function delete(string $id): bool
    {
        $stmt = Database::connection()->prepare('DELETE FROM support_tickets WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    public static function clearAll(): void
    {
        Database::connection()->exec('DELETE FROM support_tickets');
    }

    private static function nextTicketNo(): string
    {
        $stmt = Database::connection()->query('SELECT COUNT(*) AS c FROM support_tickets');
        $count = (int) ($stmt->fetch()['c'] ?? 0);
        return 'TK-' . str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private static function mapTicket(array $row): array
    {
        return [
            'id' => $row['id'],
            'ticketNo' => $row['ticket_no'],
            'subject' => $row['subject'],
            'description' => $row['description'],
            'category' => $row['category'],
            'priority' => $row['priority'],
            'status' => $row['status'],
            'createdBy' => self::parseJson($row['created_by_json'] ?? null),
            'createdAt' => self::formatIso($row['created_at']),
            'updatedAt' => isset($row['updated_at']) && $row['updated_at']
                ? self::formatIso((string) $row['updated_at'])
                : null,
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
