<?php

declare(strict_types=1);

namespace App\Core;

use Closure;
use InvalidArgumentException;

final class Router
{
    /** @var array<int, array{methods: string[], pattern: string, regex: string, keys: string[], handler: callable|array, middleware: callable[]}> */
    private array $routes = [];

    public function get(string $pattern, callable|array $handler, array $middleware = []): self
    {
        return $this->add(['GET'], $pattern, $handler, $middleware);
    }

    public function post(string $pattern, callable|array $handler, array $middleware = []): self
    {
        return $this->add(['POST'], $pattern, $handler, $middleware);
    }

    public function put(string $pattern, callable|array $handler, array $middleware = []): self
    {
        return $this->add(['PUT'], $pattern, $handler, $middleware);
    }

    public function patch(string $pattern, callable|array $handler, array $middleware = []): self
    {
        return $this->add(['PATCH'], $pattern, $handler, $middleware);
    }

    public function delete(string $pattern, callable|array $handler, array $middleware = []): self
    {
        return $this->add(['DELETE'], $pattern, $handler, $middleware);
    }

    /**
     * @param string[] $methods
     */
    public function add(array $methods, string $pattern, callable|array $handler, array $middleware = []): self
    {
        [$regex, $keys] = $this->compilePattern($pattern);
        $this->routes[] = [
            'methods' => array_map('strtoupper', $methods),
            'pattern' => $pattern,
            'regex' => $regex,
            'keys' => $keys,
            'handler' => $handler,
            'middleware' => $middleware,
        ];

        return $this;
    }

    public function group(string $prefix, Closure $callback, array $middleware = []): self
    {
        $groupRouter = new self();
        $callback($groupRouter);

        foreach ($groupRouter->routes as $route) {
            $pattern = rtrim($prefix, '/') . $route['pattern'];
            [$regex, $keys] = $this->compilePattern($pattern);
            $this->routes[] = [
                'methods' => $route['methods'],
                'pattern' => $pattern,
                'regex' => $regex,
                'keys' => $keys,
                'handler' => $route['handler'],
                'middleware' => array_merge($middleware, $route['middleware']),
            ];
        }

        return $this;
    }

  /**
   * @return array{status: int, body: mixed, headers: array<string, string>}|null
   */
    public function dispatch(string $method, string $uri): ?array
    {
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';
        $path = '/' . trim($path, '/');
        if ($path !== '/') {
            $path = rtrim($path, '/') ?: '/';
        }

        foreach ($this->routes as $route) {
            if (!in_array(strtoupper($method), $route['methods'], true)) {
                continue;
            }

            if (!preg_match($route['regex'], $path, $matches)) {
                continue;
            }

            $params = [];
            foreach ($route['keys'] as $key) {
                $params[$key] = $matches[$key] ?? null;
            }

            $request = [
                'method' => strtoupper($method),
                'path' => $path,
                'params' => $params,
                'query' => $_GET,
                'body' => $this->parseJsonBody(),
            ];

            foreach ($route['middleware'] as $middleware) {
                $result = $middleware($request);
                if (is_array($result)) {
                    return $result;
                }
            }

            $handler = $route['handler'];
            if (is_array($handler) && is_string($handler[0])) {
                $handler = [new $handler[0](), $handler[1]];
            }

            $response = $handler($request, $params);

            if (is_array($response) && isset($response['status'], $response['body'])) {
                return $response;
            }

            return [
                'status' => 200,
                'body' => $response,
                'headers' => ['Content-Type' => 'application/json'],
            ];
        }

        return null;
    }

    /**
     * @return array{0: string, 1: string[]}
     */
    private function compilePattern(string $pattern): array
    {
        $pattern = '/' . trim($pattern, '/');
        if ($pattern === '//') {
            $pattern = '/';
        }

        $keys = [];
        $regex = preg_replace_callback(
            '/:([a-zA-Z_][a-zA-Z0-9_]*)/',
            static function (array $matches) use (&$keys): string {
                $keys[] = $matches[1];
                return '(?P<' . $matches[1] . '>[^/]+)';
            },
            $pattern
        );

        if (!is_string($regex)) {
            throw new InvalidArgumentException('Invalid route pattern: ' . $pattern);
        }

        return ['#^' . $regex . '$#', $keys];
    }

    /**
     * @return array<string, mixed>
     */
    private function parseJsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
