<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use App\Helpers\Id;

final class Order
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public static function findAll(): array
    {
        $stmt = Database::connection()->query('SELECT * FROM orders ORDER BY date DESC');
        $rows = $stmt->fetchAll();
        return array_map(static fn(array $row): array => self::mapOrder($row), $rows);
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function findById(string $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? self::mapOrder($row) : null;
    }

    /**
     * @param array<string, mixed> $order
     * @param array<string, mixed>|null $actor
     * @return array<string, mixed>|null
     */
    public static function create(array $order, ?array $actor = null): ?array
    {
        $id = (string) ($order['id'] ?? Id::generateInvoiceId());
        $date = $order['date'] ?? (new \DateTimeImmutable('now'))->format(DATE_ATOM);
        $createdBy = $order['createdBy'] ?? $actor;

        if (is_string($date)) {
            $date = (new \DateTimeImmutable($date))->format('Y-m-d H:i:s');
        }

        $stmt = Database::connection()->prepare(
            'INSERT INTO orders (
                id, date, created_by_id, created_by_json, customer_name, customer_mobile,
                items_json, gross_subtotal, discount_total, subtotal, tax,
                total_before_bill_discount, bill_discount, bill_discount_type,
                bill_discount_amount, total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $id,
            $date,
            $createdBy['id'] ?? null,
            $createdBy ? json_encode($createdBy, JSON_THROW_ON_ERROR) : null,
            $order['customerName'] ?? '',
            $order['customerMobile'] ?? '',
            json_encode($order['items'] ?? [], JSON_THROW_ON_ERROR),
            (float) ($order['grossSubtotal'] ?? 0),
            (float) ($order['discountTotal'] ?? 0),
            (float) ($order['subtotal'] ?? 0),
            (float) ($order['tax'] ?? 0),
            (float) ($order['totalBeforeBillDiscount'] ?? 0),
            (float) ($order['billDiscount'] ?? 0),
            $order['billDiscountType'] ?? 'amount',
            (float) ($order['billDiscountAmount'] ?? 0),
            (float) ($order['total'] ?? 0),
        ]);

        return self::findById($id);
    }

    public static function deleteAll(): void
    {
        Database::connection()->exec('DELETE FROM orders');
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private static function mapOrder(array $row): array
    {
        return [
            'id' => $row['id'],
            'date' => self::formatIso($row['date']),
            'createdBy' => self::parseJson($row['created_by_json'] ?? null),
            'customerName' => $row['customer_name'] ?? '',
            'customerMobile' => $row['customer_mobile'] ?? '',
            'items' => self::parseJson($row['items_json'], []),
            'grossSubtotal' => (float) $row['gross_subtotal'],
            'discountTotal' => (float) $row['discount_total'],
            'subtotal' => (float) $row['subtotal'],
            'tax' => (float) $row['tax'],
            'totalBeforeBillDiscount' => (float) $row['total_before_bill_discount'],
            'billDiscount' => (float) $row['bill_discount'],
            'billDiscountType' => $row['bill_discount_type'],
            'billDiscountAmount' => (float) $row['bill_discount_amount'],
            'total' => (float) $row['total'],
        ];
    }

    private static function formatIso(string $datetime): string
    {
        return (new \DateTimeImmutable($datetime))->format(DATE_ATOM);
    }

    private static function parseJson(mixed $value, mixed $fallback): mixed
    {
        if ($value === null || $value === '') {
            return $fallback;
        }

        if (is_array($value)) {
            return $value;
        }

        try {
            return json_decode((string) $value, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return $fallback;
        }
    }
}
