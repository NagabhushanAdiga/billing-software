<?php

declare(strict_types=1);

namespace App\Helpers;

use App\Core\Database;

final class Id
{
    public static function createId(string $prefix): string
    {
        return sprintf('%s-%d-%s', $prefix, (int) (microtime(true) * 1000), substr(bin2hex(random_bytes(4)), 0, 5));
    }

    public static function randomInvoiceId(): string
    {
        $n = random_int(0, 99999);
        return 'INV' . str_pad((string) $n, 5, '0', STR_PAD_LEFT);
    }

    public static function generateInvoiceId(): string
    {
        $pdo = Database::connection();

        for ($attempt = 0; $attempt < 100; $attempt++) {
            $id = self::randomInvoiceId();
            $stmt = $pdo->prepare('SELECT id FROM orders WHERE id = ?');
            $stmt->execute([$id]);
            if (!$stmt->fetch()) {
                return $id;
            }
        }

        $fallback = 'INV' . str_pad((string) (time() % 100000), 5, '0', STR_PAD_LEFT);
        $stmt = $pdo->prepare('SELECT id FROM orders WHERE id = ?');
        $stmt->execute([$fallback]);
        if (!$stmt->fetch()) {
            return $fallback;
        }

        return 'INV' . str_pad((string) ((time() + 1) % 100000), 5, '0', STR_PAD_LEFT);
    }
}
