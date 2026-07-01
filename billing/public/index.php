<?php

declare(strict_types=1);

require dirname(__DIR__) . '/app/bootstrap.php';

$appConfig = require dirname(__DIR__) . '/config/app.php';
$basePath = $appConfig['base_path'] ?? '';

/** @var \App\Core\Router $router */
$router = require dirname(__DIR__) . '/app/routes.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($uri, PHP_URL_PATH) ?: '/';

if ($basePath !== '' && str_starts_with($path, $basePath)) {
    $path = substr($path, strlen($basePath)) ?: '/';
}
$path = '/' . trim($path, '/');
if ($path !== '/') {
    $path = rtrim($path, '/') ?: '/';
}

$response = $router->dispatch($method, $path);

if ($response === null) {
    $isApi = str_starts_with(parse_url($uri, PHP_URL_PATH) ?: '', '/api');
    http_response_code(404);
    if ($isApi) {
        header('Content-Type: application/json');
        echo json_encode(['ok' => false, 'error' => 'Not found'], JSON_THROW_ON_ERROR);
    } else {
        echo '404 Not Found';
    }
    exit;
}

http_response_code((int) $response['status']);

foreach ($response['headers'] ?? [] as $name => $value) {
    header($name . ': ' . $value);
}

$body = $response['body'] ?? null;
if ($body === null) {
    exit;
}

if (is_array($body) && str_contains((string) ($response['headers']['Content-Type'] ?? ''), 'application/json')) {
    echo json_encode($body, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    exit;
}

echo $body;
