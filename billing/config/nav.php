<?php

declare(strict_types=1);

return [
    ['path' => '/', 'label' => 'Dashboard', 'roles' => ['admin', 'cashier', 'manager'], 'icon' => 'grid'],
    ['path' => '/pos', 'label' => 'POS / Billing', 'roles' => ['admin', 'cashier', 'manager'], 'icon' => 'cart'],
    ['path' => '/recent-bills', 'label' => 'Recently billed', 'roles' => ['admin', 'cashier', 'manager'], 'icon' => 'receipt'],
    ['path' => '/products', 'label' => 'Products', 'roles' => ['admin', 'manager'], 'icon' => 'cube'],
    ['path' => '/categories', 'label' => 'Categories', 'roles' => ['admin', 'manager'], 'icon' => 'collection'],
    ['path' => '/subcategories', 'label' => 'Subcategories', 'roles' => ['admin', 'manager'], 'icon' => 'tag'],
    ['path' => '/barcodes', 'label' => 'Barcodes', 'roles' => ['admin', 'manager'], 'icon' => 'qrcode'],
    ['path' => '/reports', 'label' => 'Reports', 'roles' => ['admin', 'manager'], 'icon' => 'chart'],
    ['path' => '/team', 'label' => 'Team', 'roles' => ['admin'], 'icon' => 'users'],
    ['path' => '/settings', 'label' => 'Settings', 'roles' => ['admin'], 'icon' => 'cog'],
    ['path' => '/audit', 'label' => 'Audit log', 'roles' => ['admin'], 'icon' => 'clipboard'],
    ['path' => '/support', 'label' => 'Support', 'roles' => ['admin', 'cashier', 'manager'], 'icon' => 'support', 'bottom' => true],
];
