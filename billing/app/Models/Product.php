<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use App\Helpers\Id;

final class Product
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public static function findAll(): array
    {
        $groups = Group::findAll();
        $stmt = Database::connection()->query('SELECT * FROM products ORDER BY name');
        $rows = $stmt->fetchAll();
        return array_map(static fn(array $row): array => self::mapProduct($row, $groups), $rows);
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function findById(string $id): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM products WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }

        return self::mapProduct($row, Group::findAll());
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function findByBarcode(string $barcode): ?array
    {
        $stmt = Database::connection()->prepare('SELECT * FROM products WHERE barcode = ?');
        $stmt->execute([trim($barcode)]);
        $row = $stmt->fetch();
        if (!$row) {
            return null;
        }

        return self::mapProduct($row, Group::findAll());
    }

    public static function barcodeTaken(string $barcode, ?string $excludeId = null): bool
    {
        if ($excludeId) {
            $stmt = Database::connection()->prepare('SELECT id FROM products WHERE barcode = ? AND id != ?');
            $stmt->execute([$barcode, $excludeId]);
        } else {
            $stmt = Database::connection()->prepare('SELECT id FROM products WHERE barcode = ?');
            $stmt->execute([$barcode]);
        }

        return (bool) $stmt->fetch();
    }

    /**
     * @param array<string, mixed> $product
     * @return array<string, mixed>|null
     */
    public static function create(array $product): ?array
    {
        $id = (string) ($product['id'] ?? (string) time());
        $groups = Group::findAll();
        $groupId = self::resolveGroupId($product['groupId'] ?? null, null, $groups);
        $group = $groupId ? self::findGroup($groups, $groupId) : null;
        $subcategoryId = self::resolveSubcategoryId($product['subcategoryId'] ?? null, null, $groupId, $groups);
        $batches = is_array($product['batches'] ?? null) ? $product['batches'] : [];
        $totalStock = count($batches) > 0
            ? array_reduce($batches, static fn(float $sum, array $b): float => $sum + (float) ($b['stock'] ?? 0), 0.0)
            : (float) ($product['stock'] ?? 0);

        $stmt = Database::connection()->prepare(
            'INSERT INTO products (
                id, barcode, name, hsn, gst, group_id, subcategory_id, category,
                discount, price, stock, mrp, cost_price, batch, image, batches_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $id,
            $product['barcode'],
            $product['name'],
            $product['hsn'] ?? '',
            (float) ($product['gst'] ?? 0),
            $groupId,
            $subcategoryId,
            $product['category'] ?? ($group['name'] ?? ''),
            (float) ($product['discount'] ?? 0),
            (float) ($product['price'] ?? 0),
            $totalStock,
            $product['mrp'] ?? null,
            $product['costPrice'] ?? null,
            $product['batch'] ?? '',
            $product['image'] ?? '',
            json_encode($batches, JSON_THROW_ON_ERROR),
        ]);

        return self::findById($id);
    }

    /**
     * @param array<string, mixed> $updates
     */
    public static function update(string $id, array $updates): bool
    {
        $stmt = Database::connection()->prepare('SELECT * FROM products WHERE id = ?');
        $stmt->execute([$id]);
        $existing = $stmt->fetch();
        if (!$existing) {
            return false;
        }

        $groups = Group::findAll();
        $groupId = self::resolveGroupId($updates['groupId'] ?? null, $existing['group_id'], $groups);
        $group = $groupId ? self::findGroup($groups, $groupId) : null;
        $subcategoryId = self::resolveSubcategoryId(
            $updates['subcategoryId'] ?? null,
            $existing['subcategory_id'],
            $groupId,
            $groups
        );

        $batches = array_key_exists('batches', $updates)
            ? (is_array($updates['batches']) ? $updates['batches'] : [])
            : self::parseJson($existing['batches_json'], []);

        $totalStock = count($batches) > 0
            ? array_reduce($batches, static fn(float $sum, array $b): float => $sum + (float) ($b['stock'] ?? 0), 0.0)
            : (array_key_exists('stock', $updates) ? (float) $updates['stock'] : (float) $existing['stock']);

        $updateStmt = Database::connection()->prepare(
            'UPDATE products SET
                barcode = ?, name = ?, hsn = ?, gst = ?, group_id = ?, subcategory_id = ?,
                category = ?, discount = ?, price = ?, stock = ?, mrp = ?, cost_price = ?,
                batch = ?, image = ?, batches_json = ?, updated_at = NOW()
            WHERE id = ?'
        );
        $updateStmt->execute([
            $updates['barcode'] ?? $existing['barcode'],
            $updates['name'] ?? $existing['name'],
            $updates['hsn'] ?? $existing['hsn'],
            array_key_exists('gst', $updates) ? (float) $updates['gst'] : (float) $existing['gst'],
            $groupId,
            $subcategoryId,
            $updates['category'] ?? ($group['name'] ?? $existing['category']),
            array_key_exists('discount', $updates) ? (float) $updates['discount'] : (float) $existing['discount'],
            array_key_exists('price', $updates) ? (float) $updates['price'] : (float) $existing['price'],
            $totalStock,
            array_key_exists('mrp', $updates) ? $updates['mrp'] : $existing['mrp'],
            array_key_exists('costPrice', $updates) ? $updates['costPrice'] : $existing['cost_price'],
            $updates['batch'] ?? $existing['batch'],
            $updates['image'] ?? $existing['image'],
            json_encode($batches, JSON_THROW_ON_ERROR),
            $id,
        ]);

        return true;
    }

    public static function delete(string $id): bool
    {
        $stmt = Database::connection()->prepare('DELETE FROM products WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    public static function deleteAll(): void
    {
        Database::connection()->exec('DELETE FROM products');
    }

    /**
     * @param array<int, array<string, mixed>> $items
     */
    public static function deductStockForOrder(array $items): void
    {
        $pdo = Database::connection();

        foreach ($items as $line) {
            $stmt = $pdo->prepare('SELECT * FROM products WHERE barcode = ?');
            $stmt->execute([$line['barcode'] ?? '']);
            $product = $stmt->fetch();
            if (!$product) {
                continue;
            }

            $batches = self::parseJson($product['batches_json'], []);
            $qty = (float) ($line['qty'] ?? 0);

            if (count($batches) > 0) {
                $nextBatches = $batches;
                $productBatchId = $line['productBatchId'] ?? null;

                if ($productBatchId) {
                    $nextBatches = array_map(
                        static function (array $batch) use ($productBatchId, $qty): array {
                            if (($batch['id'] ?? null) === $productBatchId) {
                                $batch['stock'] = max(0.0, (float) ($batch['stock'] ?? 0) - $qty);
                            }
                            return $batch;
                        },
                        $nextBatches
                    );
                } else {
                    $target = null;
                    foreach ($nextBatches as $batch) {
                        if ((float) ($batch['stock'] ?? 0) > 0) {
                            $target = $batch;
                            break;
                        }
                    }
                    $target ??= $nextBatches[0] ?? null;

                    if ($target) {
                        $targetId = $target['id'] ?? null;
                        $nextBatches = array_map(
                            static function (array $batch) use ($targetId, $qty): array {
                                if (($batch['id'] ?? null) === $targetId) {
                                    $batch['stock'] = max(0.0, (float) ($batch['stock'] ?? 0) - $qty);
                                }
                                return $batch;
                            },
                            $nextBatches
                        );
                    }
                }

                $totalStock = array_reduce(
                    $nextBatches,
                    static fn(float $sum, array $b): float => $sum + (float) ($b['stock'] ?? 0),
                    0.0
                );

                $update = $pdo->prepare(
                    'UPDATE products SET batches_json = ?, stock = ?, updated_at = NOW() WHERE id = ?'
                );
                $update->execute([json_encode($nextBatches, JSON_THROW_ON_ERROR), $totalStock, $product['id']]);
            } else {
                $stock = (float) $product['stock'];
                if (is_finite($stock)) {
                    $update = $pdo->prepare('UPDATE products SET stock = ?, updated_at = NOW() WHERE id = ?');
                    $update->execute([max(0.0, $stock - $qty), $product['id']]);
                }
            }
        }
    }

    /**
     * @param array<string, mixed> $row
     * @param array<int, array<string, mixed>> $groups
     * @return array<string, mixed>
     */
    private static function mapProduct(array $row, array $groups): array
    {
        $group = $row['group_id'] ? self::findGroup($groups, (string) $row['group_id']) : null;
        $sub = null;
        if ($group && $row['subcategory_id']) {
            foreach ($group['subcategories'] as $candidate) {
                if ($candidate['id'] === $row['subcategory_id']) {
                    $sub = $candidate;
                    break;
                }
            }
        }

        return [
            'id' => $row['id'],
            'barcode' => $row['barcode'],
            'name' => $row['name'],
            'hsn' => $row['hsn'] ?? '',
            'gst' => (float) ($row['gst'] ?? 0),
            'groupId' => $row['group_id'] ?? '',
            'subcategoryId' => $row['subcategory_id'] ?? '',
            'category' => $row['category'] ?: ($group['name'] ?? ''),
            'subcategory' => $sub['name'] ?? '',
            'discount' => (float) ($row['discount'] ?? 0),
            'price' => (float) ($row['price'] ?? 0),
            'stock' => (float) ($row['stock'] ?? 0),
            'mrp' => $row['mrp'] !== null ? (float) $row['mrp'] : null,
            'costPrice' => $row['cost_price'] !== null ? (float) $row['cost_price'] : null,
            'batch' => $row['batch'] ?? '',
            'image' => $row['image'] ?? '',
            'batches' => self::parseJson($row['batches_json'], []),
        ];
    }

    /**
     * @param array<int, array<string, mixed>> $groups
     */
    private static function findGroup(array $groups, string $groupId): ?array
    {
        foreach ($groups as $group) {
            if ($group['id'] === $groupId) {
                return $group;
            }
        }
        return null;
    }

    /**
     * @param array<int, array<string, mixed>> $groups
     */
    private static function resolveGroupId(mixed $value, ?string $existingGroupId, array $groups): ?string
    {
        if ($value === null) {
            if ($existingGroupId && self::findGroup($groups, $existingGroupId)) {
                return $existingGroupId;
            }
            return null;
        }

        if ($value === '' || $value === false) {
            return null;
        }

        return self::findGroup($groups, (string) $value) ? (string) $value : null;
    }

    /**
     * @param array<int, array<string, mixed>> $groups
     */
    private static function resolveSubcategoryId(
        mixed $value,
        ?string $existingSubcategoryId,
        ?string $groupId,
        array $groups
    ): ?string {
        if (!$groupId) {
            return null;
        }

        $group = self::findGroup($groups, $groupId);
        if (!$group) {
            return null;
        }

        if ($value === null) {
            if ($existingSubcategoryId) {
                foreach ($group['subcategories'] as $sub) {
                    if ($sub['id'] === $existingSubcategoryId) {
                        return $existingSubcategoryId;
                    }
                }
            }
            return null;
        }

        if ($value === '' || $value === false) {
            return null;
        }

        foreach ($group['subcategories'] as $sub) {
            if ($sub['id'] === $value) {
                return (string) $value;
            }
        }

        return null;
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
