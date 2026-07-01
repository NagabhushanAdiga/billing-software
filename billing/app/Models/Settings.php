<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use App\Helpers\Id;

final class Settings
{
    /** @var array<string, mixed> */
    private const DEFAULTS = [
        'storeName' => 'SuperMart Billing',
        'storeAddress' => '',
        'storeGstin' => '',
        'storeWebsite' => '',
        'storeUpiId' => '',
        'taxRate' => 5.0,
        'currency' => '₹',
        'discountEnabled' => true,
        'discountType' => 'percent',
        'maxDiscountPercent' => 50.0,
        'billDiscountEnabled' => false,
    ];

    /**
     * @return array<string, mixed>
     */
    public static function get(): array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM settings WHERE id = 1');
        $stmt->execute();
        $row = $stmt->fetch();

        if (!$row) {
            Database::connection()->prepare('INSERT INTO settings (id) VALUES (1)')->execute();
            $stmt->execute();
            $row = $stmt->fetch();
        }

        return self::mapSettings($row ?: null);
    }

    /**
     * @param array<string, mixed> $updates
     * @return array<string, mixed>
     */
    public static function update(array $updates): array
    {
        $current = self::get();
        $next = array_merge($current, $updates);

        $stmt = Database::connection()->prepare(
            'UPDATE settings SET
                store_name = ?, store_address = ?, store_gstin = ?, store_website = ?,
                store_upi_id = ?, tax_rate = ?, currency = ?, discount_enabled = ?,
                discount_type = ?, max_discount_percent = ?, bill_discount_enabled = ?
            WHERE id = 1'
        );
        $stmt->execute([
            $next['storeName'],
            $next['storeAddress'],
            $next['storeGstin'],
            $next['storeWebsite'],
            $next['storeUpiId'],
            (float) $next['taxRate'],
            $next['currency'],
            $next['discountEnabled'] ? 1 : 0,
            $next['discountType'],
            (float) $next['maxDiscountPercent'],
            $next['billDiscountEnabled'] ? 1 : 0,
        ]);

        return self::get();
    }

    /**
     * @return array<string, mixed>
     */
    public static function reset(): array
    {
        $pdo = Database::connection();
        $pdo->exec('DELETE FROM settings');
        $pdo->prepare('INSERT INTO settings (id) VALUES (1)')->execute();
        return self::get();
    }

    /**
     * @param array<string, mixed>|null $row
     * @return array<string, mixed>
     */
    private static function mapSettings(?array $row): array
    {
        if (!$row) {
            return self::DEFAULTS;
        }

        return [
            'storeName' => $row['store_name'],
            'storeAddress' => $row['store_address'],
            'storeGstin' => $row['store_gstin'],
            'storeWebsite' => $row['store_website'],
            'storeUpiId' => $row['store_upi_id'],
            'taxRate' => (float) $row['tax_rate'],
            'currency' => $row['currency'],
            'discountEnabled' => (bool) $row['discount_enabled'],
            'discountType' => $row['discount_type'],
            'maxDiscountPercent' => (float) $row['max_discount_percent'],
            'billDiscountEnabled' => (bool) $row['bill_discount_enabled'],
        ];
    }
}
