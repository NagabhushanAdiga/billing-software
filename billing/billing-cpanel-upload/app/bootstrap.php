<?php

declare(strict_types=1);

$root = dirname(__DIR__);

if (is_file($root . '/vendor/autoload.php')) {
    require $root . '/vendor/autoload.php';
} else {
    require $root . '/app/autoload.php';
}

/**
 * Load key=value pairs from a .env file into getenv/$_ENV/$_SERVER.
 */
function loadEnvFile(string $path): void
{
    if (!is_file($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        if (!str_contains($line, '=')) {
            continue;
        }

        [$name, $value] = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);

        if (
            (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
            (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        if ($name === '') {
            continue;
        }

        if (getenv($name) === false) {
            putenv($name . '=' . $value);
        }
        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
    }
}

loadEnvFile($root . '/.env');
require $root . '/app/Helpers/functions.php';

$appConfig = require $root . '/config/app.php';
date_default_timezone_set($appConfig['timezone']);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name($appConfig['session_name']);
    $cookiePath = $appConfig['base_path'] !== '' ? $appConfig['base_path'] : '/';
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => $cookiePath,
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

if ($appConfig['debug']) {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);
    ini_set('display_errors', '0');
}

set_exception_handler(static function (Throwable $e) use ($appConfig): void {
    http_response_code(500);
    if (str_contains($_SERVER['REQUEST_URI'] ?? '', '/api/')) {
        header('Content-Type: application/json');
        $payload = ['ok' => false, 'error' => 'Internal server error'];
        if ($appConfig['debug']) {
            $payload['details'] = $e->getMessage();
        }
        echo json_encode($payload);
        return;
    }

    if ($appConfig['debug']) {
        echo '<h1>Application Error</h1><pre>' . htmlspecialchars($e->getMessage()) . '</pre>';
        return;
    }

    echo 'Internal server error';
});

set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});
