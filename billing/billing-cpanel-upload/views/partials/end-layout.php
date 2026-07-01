<?php

declare(strict_types=1);

$content = ob_get_clean();
require dirname(__DIR__) . '/layouts/app.php';
