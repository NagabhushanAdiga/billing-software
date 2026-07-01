<?php

declare(strict_types=1);

return [
    'host' => (string) (getenv('DB_HOST') ?: '127.0.0.1'),
    'port' => (int) (getenv('DB_PORT') ?: 3306),
    'name' => (string) (getenv('DB_NAME') ?: 'billing'),
    'user' => (string) (getenv('DB_USER') ?: 'root'),
    'pass' => (string) (getenv('DB_PASS') ?: ''),
    'charset' => 'utf8mb4',
];
