<?php

declare(strict_types=1);

return [
    'name' => 'SuperMart Billing',
    'url' => rtrim((string) (getenv('APP_URL') ?: 'http://localhost'), '/'),
    'base_path' => rtrim((string) (getenv('APP_BASE_PATH') ?: ''), '/'),
    'session_name' => (string) (getenv('SESSION_NAME') ?: 'billing_session'),
    'timezone' => 'Asia/Kolkata',
    'env' => (string) (getenv('APP_ENV') ?: 'development'),
    'debug' => filter_var(getenv('APP_DEBUG') ?: 'true', FILTER_VALIDATE_BOOL),
];
