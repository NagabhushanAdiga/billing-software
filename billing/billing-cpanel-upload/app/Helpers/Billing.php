<?php

declare(strict_types=1);

namespace App\Helpers;

final class Billing
{
    public const QTY_DECIMALS = 3;

    public static function roundQty(float|int|string $q): float
    {
        $n = (float) $q;
        if (!is_finite($n)) {
            return 0.0;
        }
        $factor = 10 ** self::QTY_DECIMALS;
        return round($n * $factor) / $factor;
    }

    public static function parseStock(float|int|string|null $value): float
    {
        $n = (float) $value;
        return is_finite($n) && $n >= 0 ? self::roundQty($n) : 0.0;
    }

    public static function parseQty(float|int|string|null $value, float $fallback = 1.0): float
    {
        $trimmed = trim((string) ($value ?? ''));
        if ($trimmed === '') {
            $fb = self::roundQty($fallback);
            return $fb > 0 ? $fb : 1.0;
        }

        $n = (float) $trimmed;
        if (!is_finite($n) || $n <= 0) {
            $fb = self::roundQty($fallback);
            return $fb > 0 ? $fb : 1.0;
        }

        return self::roundQty($n);
    }

    public static function formatQty(float|int $qty): string
    {
        $n = self::roundQty($qty);
        if (fmod($n, 1.0) === 0.0) {
            return (string) (int) $n;
        }

        $formatted = number_format($n, self::QTY_DECIMALS, '.', '');
        return rtrim(rtrim($formatted, '0'), '.');
    }

    /**
     * @param array<string, mixed> $item
     */
    public static function lineGross(array $item): float
    {
        return (float) $item['price'] * (float) $item['qty'];
    }

    /**
     * @param array<string, mixed> $item
     */
    public static function discountBasePrice(array $item): float
    {
        $mrp = (float) ($item['mrp'] ?? 0);
        if (is_finite($mrp) && $mrp > 0) {
            return $mrp;
        }
        return (float) ($item['price'] ?? 0);
    }

    /**
     * @param array<string, mixed> $product
     */
    public static function getProductStock(array $product): float
    {
        $batches = $product['batches'] ?? null;
        if (is_array($batches) && count($batches) > 0) {
            $sum = 0.0;
            foreach ($batches as $batch) {
                $sum += self::parseStock($batch['stock'] ?? 0);
            }
            return $sum;
        }

        $n = (float) ($product['stock'] ?? 0);
        return is_finite($n) && $n >= 0 ? self::roundQty($n) : 99.0;
    }

    /**
     * @param array<string, mixed> $product
     */
    public static function getCartLineStock(array $product, ?string $productBatchId = null): float
    {
        if ($productBatchId && is_array($product['batches'] ?? null)) {
            foreach ($product['batches'] as $batch) {
                if (($batch['id'] ?? null) === $productBatchId) {
                    return self::parseStock($batch['stock'] ?? 0);
                }
            }
        }

        return self::getProductStock($product);
    }

    /**
     * @param array<string, mixed> $product
     */
    public static function clampQtyToStock(float $qty, array $product, ?string $productBatchId = null): float
    {
        $max = self::getCartLineStock($product, $productBatchId);
        $q = self::roundQty(max(0.0, $qty));
        return min($q, $max);
    }

    /**
     * @param array<string, mixed> $product
     */
    public static function remainingStock(array $product, float $inCartQty = 0.0, ?string $productBatchId = null): float
    {
        return max(0.0, self::getCartLineStock($product, $productBatchId) - $inCartQty);
    }

    public static function parseAddQty(float|int|string|null $value): float
    {
        return self::parseQty($value, 1.0);
    }

    /**
     * @param array<string, mixed> $item
     */
    public static function resolveItemGstRate(array $item, float $defaultTaxRate = 0.0): float
    {
        $g = $item['gst'] ?? null;
        if ($g === '' || $g === null) {
            return (float) $defaultTaxRate;
        }

        $n = (float) $g;
        if (!is_finite($n) || $n < 0) {
            return (float) $defaultTaxRate;
        }

        if ($n === 0.0) {
            return (float) $defaultTaxRate;
        }

        return $n;
    }

    public static function normalizeGst(float|int|string|null $value): ?float
    {
        if ($value === '' || $value === null) {
            return null;
        }

        $n = (float) $value;
        if (!is_finite($n) || $n < 0 || $n > 100) {
            return null;
        }

        return $n;
    }

    /**
     * @param array<string, mixed> $item
     */
    public static function lineSavingsVsMrp(array $item): float
    {
        $qty = (float) ($item['qty'] ?? 1);
        $mrpUnit = self::discountBasePrice($item);
        $priceUnit = (float) ($item['price'] ?? 0);
        return max(0.0, $mrpUnit - $priceUnit) * $qty;
    }

    /**
     * @param array<string, mixed> $item
     */
    public static function lineDiscountAmount(
        array $item,
        string $discountType = 'percent',
        float $maxDiscountPercent = 100.0
    ): float {
        $sellingGross = self::lineGross($item);
        $discount = max(0.0, (float) ($item['discount'] ?? 0));
        if ($discount <= 0 || $sellingGross <= 0) {
            return 0.0;
        }

        if ($discountType === 'percent') {
            return 0.0;
        }

        $qty = (float) ($item['qty'] ?? 1);
        $mrpUnit = self::discountBasePrice($item);
        $unitDiscount = min($discount, $mrpUnit);
        return min($unitDiscount * $qty, $sellingGross);
    }

    /**
     * @param array<string, mixed> $item
     */
    public static function lineSavingsDisplay(
        array $item,
        string $discountType = 'percent',
        float $maxDiscountPercent = 100.0
    ): float {
        if ($discountType === 'percent') {
            return self::lineSavingsVsMrp($item);
        }

        return self::lineDiscountAmount($item, $discountType, $maxDiscountPercent);
    }

    /**
     * @param array<string, mixed> $item
     */
    public static function lineNet(
        array $item,
        string $discountType = 'percent',
        float $maxDiscountPercent = 100.0
    ): float {
        return max(0.0, self::lineGross($item) - self::lineDiscountAmount($item, $discountType, $maxDiscountPercent));
    }

    /**
     * @param array<string, mixed> $item
     */
    public static function lineTax(
        array $item,
        float $defaultTaxRate = 0.0,
        string $discountType = 'percent',
        float $maxDiscountPercent = 100.0
    ): float {
        $rate = self::resolveItemGstRate($item, $defaultTaxRate);
        $inclusive = self::lineNet($item, $discountType, $maxDiscountPercent);
        if ($rate <= 0 || $inclusive <= 0) {
            return 0.0;
        }

        return $inclusive * ($rate / (100 + $rate));
    }

    /**
     * @param array<string, mixed> $item
     */
    public static function lineTaxableValue(
        array $item,
        float $defaultTaxRate = 0.0,
        string $discountType = 'percent',
        float $maxDiscountPercent = 100.0
    ): float {
        return self::lineNet($item, $discountType, $maxDiscountPercent)
            - self::lineTax($item, $defaultTaxRate, $discountType, $maxDiscountPercent);
    }

    /**
     * @param array<string, mixed> $item
     */
    public static function lineTotalWithTax(
        array $item,
        float $defaultTaxRate = 0.0,
        string $discountType = 'percent',
        float $maxDiscountPercent = 100.0
    ): float {
        return self::lineNet($item, $discountType, $maxDiscountPercent);
    }

    /**
     * @param array<int, array<string, mixed>> $items
     * @param array<string, mixed> $options
     * @return array<string, float>
     */
    public static function calcCartTotals(array $items, array $options = []): array
    {
        $taxRate = (float) ($options['taxRate'] ?? 0);
        $discountType = (string) ($options['discountType'] ?? 'percent');
        $maxDiscountPercent = (float) ($options['maxDiscountPercent'] ?? 100);

        $grossSubtotal = 0.0;
        $discountApplied = 0.0;
        $discountTotal = 0.0;
        $tax = 0.0;

        foreach ($items as $item) {
            $grossSubtotal += self::lineGross($item);
            $discountApplied += self::lineDiscountAmount($item, $discountType, $maxDiscountPercent);
            $discountTotal += self::lineSavingsDisplay($item, $discountType, $maxDiscountPercent);
            $tax += self::lineTax($item, $taxRate, $discountType, $maxDiscountPercent);
        }

        $subtotal = $grossSubtotal - $discountApplied;

        return [
            'grossSubtotal' => $grossSubtotal,
            'discountTotal' => $discountTotal,
            'discountApplied' => $discountApplied,
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $subtotal,
        ];
    }

    public static function calcBillDiscountAmount(
        float $totalBeforeDiscount,
        float $billDiscount,
        string $billDiscountType = 'amount'
    ): float {
        $base = max(0.0, $totalBeforeDiscount);
        $raw = max(0.0, $billDiscount);
        if ($raw <= 0 || $base <= 0) {
            return 0.0;
        }

        if ($billDiscountType === 'percent') {
            $pct = min($raw, 100.0);
            return min($base * ($pct / 100), $base);
        }

        return min($raw, $base);
    }

    /**
     * @param array<string, float> $cartTotals
     * @param array<string, mixed> $options
     * @return array<string, float|string>
     */
    public static function applyBillDiscount(array $cartTotals, array $options = []): array
    {
        $billDiscount = (float) ($options['billDiscount'] ?? 0);
        $billDiscountType = (string) ($options['billDiscountType'] ?? 'amount');
        $totalBeforeBillDiscount = (float) ($cartTotals['total'] ?? 0);
        $billDiscountAmount = self::calcBillDiscountAmount($totalBeforeBillDiscount, $billDiscount, $billDiscountType);

        return array_merge($cartTotals, [
            'billDiscount' => max(0.0, $billDiscount),
            'billDiscountType' => $billDiscountType,
            'billDiscountAmount' => $billDiscountAmount,
            'totalBeforeBillDiscount' => $totalBeforeBillDiscount,
            'total' => max(0.0, $totalBeforeBillDiscount - $billDiscountAmount),
        ]);
    }

    /**
     * @param array<string, mixed> $item
     */
    public static function clampDiscount(
        float|int|string $value,
        string $discountType,
        array $item,
        float $maxDiscountPercent = 100.0
    ): float {
        $num = max(0.0, (float) $value);
        if ($discountType === 'amount') {
            return min($num, self::discountBasePrice($item));
        }

        return min($num, $maxDiscountPercent);
    }

    public static function formatProductDiscount(
        float $discount,
        string $discountType,
        string $currency = '₹'
    ): string {
        if ($discount <= 0) {
            return 'No discount';
        }

        if ($discountType === 'percent') {
            return $discount . '% of MRP';
        }

        return $currency . number_format($discount, 2) . ' off MRP / unit';
    }
}
