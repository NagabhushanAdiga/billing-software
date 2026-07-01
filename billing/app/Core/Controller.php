<?php

declare(strict_types=1);

namespace App\Core;

abstract class Controller
{
    /**
     * @param array<string, mixed> $data
     */
    protected function view(string $view, array $data = [], int $status = 200): array
    {
        return [
            'status' => $status,
            'body' => View::render($view, $data),
            'headers' => ['Content-Type' => 'text/html; charset=UTF-8'],
        ];
    }

    /**
     * @param mixed $data
     */
    protected function json(mixed $data, int $status = 200): array
    {
        return [
            'status' => $status,
            'body' => $data,
            'headers' => ['Content-Type' => 'application/json'],
        ];
    }

    protected function redirect(string $url, int $status = 302): array
    {
        return [
            'status' => $status,
            'body' => null,
            'headers' => ['Location' => $url],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function requestBody(array $request): array
    {
        return is_array($request['body'] ?? null) ? $request['body'] : [];
    }
}
