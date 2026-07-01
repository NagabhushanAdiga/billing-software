<?php

declare(strict_types=1);

namespace App\Core;

use RuntimeException;

final class View
{
    /**
     * @param array<string, mixed> $data
     */
    public static function render(string $view, array $data = []): string
    {
        $path = dirname(__DIR__, 2) . '/views/' . str_replace('.', '/', $view) . '.php';
        if (!is_file($path)) {
            throw new RuntimeException('View not found: ' . $view);
        }

        extract($data, EXTR_SKIP);
        ob_start();
        include $path;
        $content = ob_get_clean();

        return $content === false ? '' : $content;
    }
}
