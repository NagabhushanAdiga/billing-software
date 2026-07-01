<?php

declare(strict_types=1);

namespace App\Helpers;

use App\Models\AuditLog;

final class Audit
{
    /**
     * @param array<string, mixed>|null $actor
     * @return array<string, mixed>
     */
    public static function log(
        string $action,
        string $category = 'system',
        string $details = '',
        ?array $actor = null
    ): array {
        return AuditLog::create([
            'action' => $action,
            'category' => $category,
            'details' => $details,
            'actor' => $actor,
        ]);
    }
}
