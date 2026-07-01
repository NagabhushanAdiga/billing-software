#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * CLI installer: applies schema.sql and seeds initial data (mirrors backend/database/seed.js).
 *
 * Usage: php database/install.php
 */

$root = dirname(__DIR__);

if (php_sapi_name() !== 'cli') {
    fwrite(STDERR, "Run this script from the command line.\n");
    exit(1);
}

require $root . '/app/bootstrap.php';

$dbConfig = require $root . '/config/database.php';
$schemaPath = $root . '/database/schema.sql';

if (!is_file($schemaPath)) {
    fwrite(STDERR, "Schema file not found: {$schemaPath}\n");
    exit(1);
}

$dsn = sprintf(
    'mysql:host=%s;port=%d;charset=%s',
    $dbConfig['host'],
    $dbConfig['port'],
    $dbConfig['charset']
);

try {
    $pdo = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
} catch (PDOException $e) {
    fwrite(STDERR, 'MySQL connection failed: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}

$pdo->exec('CREATE DATABASE IF NOT EXISTS `' . str_replace('`', '``', $dbConfig['name']) . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
$pdo->exec('USE `' . str_replace('`', '``', $dbConfig['name']) . '`');

$schema = file_get_contents($schemaPath);
if ($schema === false) {
    fwrite(STDERR, "Unable to read schema file.\n");
    exit(1);
}

foreach (array_filter(array_map('trim', explode(';', $schema))) as $statement) {
    if ($statement === '') {
        continue;
    }
    $pdo->exec($statement);
}

echo "Schema applied.\n";

$count = (int) $pdo->query('SELECT COUNT(*) AS c FROM users')->fetch(PDO::FETCH_ASSOC)['c'];
if ($count > 0) {
    echo "Database already seeded — skipping.\n";
    exit(0);
}

$adminUsername = strtolower(trim((string) (getenv('INITIAL_ADMIN_USERNAME') ?: 'naga')));
$adminPassword = trim((string) (getenv('INITIAL_ADMIN_PASSWORD') ?: '12345'));
$adminName = trim((string) (getenv('INITIAL_ADMIN_NAME') ?: 'Naga'));

if (strlen($adminPassword) < 4) {
    echo "Warning: No admin user created. Set INITIAL_ADMIN_PASSWORD in .env (min 4 characters) and re-run.\n";
} else {
    $insertUser = $pdo->prepare(
        'INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)'
    );
    $insertUser->execute([
        'usr-admin',
        $adminUsername,
        password_hash($adminPassword, PASSWORD_DEFAULT),
        $adminName,
        'admin',
    ]);
    echo "Admin user created: {$adminUsername}\n";
}

$initialGroups = [
    ['id' => 'grp-grocery', 'name' => 'Grocery'],
    ['id' => 'grp-daily', 'name' => 'Daily products'],
    ['id' => 'grp-dairy', 'name' => 'Dairy'],
    ['id' => 'grp-personal', 'name' => 'Personal Care'],
    ['id' => 'grp-hardware', 'name' => 'Hardware'],
    ['id' => 'grp-other', 'name' => 'Other'],
];

$insertGroup = $pdo->prepare('INSERT INTO groups (id, name) VALUES (?, ?)');
foreach ($initialGroups as $group) {
    $insertGroup->execute([$group['id'], $group['name']]);
}

$initialSubcategories = [
    ['id' => 'sub-milk', 'group_id' => 'grp-daily', 'name' => 'Milk products'],
    ['id' => 'sub-bread', 'group_id' => 'grp-daily', 'name' => 'Breads'],
];

$insertSub = $pdo->prepare('INSERT INTO subcategories (id, group_id, name) VALUES (?, ?, ?)');
foreach ($initialSubcategories as $sub) {
    $insertSub->execute([$sub['id'], $sub['group_id'], $sub['name']]);
}

$initialBatches = [
    ['id' => 'bat-2024-a', 'name' => 'Batch 2024-A'],
    ['id' => 'bat-2024-b', 'name' => 'Batch 2024-B'],
];

$insertBatch = $pdo->prepare('INSERT INTO batches (id, name) VALUES (?, ?)');
foreach ($initialBatches as $batch) {
    $insertBatch->execute([$batch['id'], $batch['name']]);
}

$groupByCategory = [
    'Grocery' => 'grp-grocery',
    'Dairy' => 'grp-dairy',
    'Daily products' => 'grp-daily',
    'Personal Care' => 'grp-personal',
    'Hardware' => 'grp-hardware',
    'Other' => 'grp-other',
];

$initialProducts = [
    ['1', '8901234567890', 'Rice 1kg', 65, 'Grocery', 0, 120],
    ['2', '8901234567891', 'Dal 500g', 120, 'Grocery', 0, 80],
    ['3', '8901234567892', 'Cooking Oil 1L', 180, 'Grocery', 0, 45],
    ['4', '8901234567893', 'Soap Bar', 40, 'Personal Care', 5, 200],
    ['5', '8901234567894', 'Milk 1L', 55, 'Dairy', 0, 60],
    ['6', '8901234567895', 'Tea 500g', 220, 'Grocery', 0, 35],
    ['7', '8901234567896', 'Sugar 1kg', 48, 'Grocery', 0, 90],
    ['8', '8901234567897', 'Wheat Flour 1kg', 35, 'Grocery', 0, 100],
    ['9', '8901234567898', 'Shampoo 200ml', 145, 'Personal Care', 10, 40],
    ['10', '8901234567899', 'Toothpaste', 85, 'Personal Care', 0, 75],
    ['11', '8901234567800', 'Bulb 9W LED', 95, 'Hardware', 0, 150],
    ['12', '8901234567801', 'Wire 1.5mm 90m', 450, 'Hardware', 0, 12],
    ['13', '8901234567802', 'Switch Single', 65, 'Hardware', 0, 85],
    ['14', '8901234567803', 'Socket 6A', 120, 'Hardware', 0, 55],
    ['15', '8901234567804', 'Screwdriver Set', 180, 'Hardware', 0, 25],
    ['16', '8901234567805', 'Nails 500g', 55, 'Hardware', 0, 110],
    ['17', '8901234567806', 'Adhesive Tape', 30, 'Hardware', 0, 200],
    ['18', '8901234567807', 'Battery 9V', 45, 'Hardware', 0, 95],
];

$insertProduct = $pdo->prepare(
    'INSERT INTO products (
        id, barcode, name, hsn, gst, group_id, category, discount, price, stock, image, batches_json
    ) VALUES (?, ?, ?, \'\', 0, ?, ?, ?, ?, ?, ?, JSON_ARRAY())'
);

foreach ($initialProducts as [$id, $barcode, $name, $price, $category, $discount, $stock]) {
    $groupId = $groupByCategory[$category] ?? 'grp-other';
    $insertProduct->execute([
        $id,
        $barcode,
        $name,
        $groupId,
        $category,
        $discount,
        $price,
        $stock,
        "https://picsum.photos/seed/{$id}/200/200",
    ]);
}

$pdo->prepare('INSERT INTO settings (id) VALUES (1)')->execute();

$adminActor = json_encode([
    'id' => 'usr-admin',
    'username' => $adminUsername,
    'name' => $adminName,
    'role' => 'admin',
], JSON_THROW_ON_ERROR);

$now = time();
$orderStmt = $pdo->prepare(
    'INSERT INTO orders (
        id, date, created_by_id, created_by_json, items_json,
        gross_subtotal, discount_total, subtotal, tax, total_before_bill_discount,
        bill_discount, bill_discount_type, bill_discount_amount, total
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, \'amount\', 0, ?)'
);

$orderStmt->execute([
    'ord-001',
    gmdate('Y-m-d H:i:s', $now - 86400),
    'usr-admin',
    $adminActor,
    json_encode([
        ['name' => 'Rice 1kg', 'barcode' => '8901234567890', 'price' => 65, 'qty' => 2],
        ['name' => 'Dal 500g', 'barcode' => '8901234567891', 'price' => 120, 'qty' => 1],
    ], JSON_THROW_ON_ERROR),
    250,
    0,
    250,
    12.5,
    262.5,
    262.5,
]);

$orderStmt->execute([
    'ord-002',
    gmdate('Y-m-d H:i:s', $now - 3600),
    'usr-admin',
    $adminActor,
    json_encode([
        ['name' => 'Bulb 9W LED', 'barcode' => '8901234567800', 'price' => 95, 'qty' => 3],
        ['name' => 'Switch Single', 'barcode' => '8901234567802', 'price' => 65, 'qty' => 2],
    ], JSON_THROW_ON_ERROR),
    415,
    0,
    415,
    20.75,
    435.75,
    435.75,
]);

echo "Database seeded.\n";
