<?php

declare(strict_types=1);

use App\Controllers\PageController;
use App\Core\Auth;
use App\Core\Router;
use App\Helpers\Audit;
use App\Models\AuditLog;
use App\Models\Batch;
use App\Models\Group;
use App\Models\Order;
use App\Models\Product;
use App\Models\Settings;
use App\Models\SupportTicket;
use App\Models\User;

/**
 * @param array<string, mixed> $payload
 * @return array{status: int, body: array<string, mixed>, headers: array<string, string>}
 */
function apiOk(array $payload = [], int $status = 200): array
{
    return [
        'status' => $status,
        'body' => array_merge(['ok' => true], $payload),
        'headers' => ['Content-Type' => 'application/json'],
    ];
}

/**
 * @return array{status: int, body: array<string, mixed>, headers: array<string, string>}
 */
function apiFail(string $error, int $status = 400): array
{
    return [
        'status' => $status,
        'body' => ['ok' => false, 'error' => $error],
        'headers' => ['Content-Type' => 'application/json'],
    ];
}

/**
 * @param array<string, mixed> $request
 * @return array<string, mixed>
 */
function body(array $request): array
{
    return is_array($request['body'] ?? null) ? $request['body'] : [];
}

$router = new Router();

// -------------------------------------------------------------------------
// Web routes
// -------------------------------------------------------------------------

$router->get('/', static fn(): ?array => PageController::dashboard());
$router->get('/login', static fn(): ?array => PageController::loginForm());
$router->post('/login', static fn(): ?array => PageController::loginSubmit());
$router->post('/logout', static fn(): ?array => PageController::logout());

$router->get('/pos', static fn(): ?array => PageController::pos());
$router->get('/recent-bills', static fn(): ?array => PageController::recentBills());
$router->get('/invoice/:id', static fn(array $req, array $params): ?array => PageController::invoice((string) $params['id']));

$router->get('/products', static fn(): ?array => PageController::products());
$router->post('/products/save', static fn(): ?array => PageController::productSave());
$router->post('/products/delete', static fn(): ?array => PageController::productDelete());

$router->get('/categories', static fn(): ?array => PageController::categories());
$router->post('/categories/save', static fn(): ?array => PageController::categorySave());
$router->post('/categories/delete', static fn(): ?array => PageController::categoryDelete());

$router->get('/subcategories', static fn(): ?array => PageController::subcategories());
$router->post('/subcategories/save', static fn(): ?array => PageController::subcategorySave());
$router->post('/subcategories/delete', static fn(): ?array => PageController::subcategoryDelete());

$router->get('/barcodes', static fn(): ?array => PageController::barcodes());
$router->get('/reports', static fn(): ?array => PageController::reports());
$router->get('/team', static fn(): ?array => PageController::team());
$router->post('/team/save', static fn(): ?array => PageController::teamSave());
$router->post('/team/delete', static fn(): ?array => PageController::teamDelete());
$router->get('/settings', static fn(): ?array => PageController::settings());
$router->post('/settings/save', static fn(): ?array => PageController::settingsSave());
$router->get('/audit', static fn(): ?array => PageController::audit());
$router->get('/support', static fn(): ?array => PageController::support());
$router->post('/support/save', static fn(): ?array => PageController::supportSave());

// -------------------------------------------------------------------------
// API routes
// -------------------------------------------------------------------------

$router->group('/api', static function (Router $api): void {
    $auth = Auth::requireAuth();
    $admin = Auth::requireAdmin();

    $api->get('/health', static fn(): array => apiOk(['service' => 'billing-api']));

    // Auth
    $api->post('/auth/login', static function (array $request): array {
        $payload = body($request);
        $username = trim((string) ($payload['username'] ?? ''));
        $password = (string) ($payload['password'] ?? '');

        if ($username === '' || $password === '') {
            return apiFail('Username and password are required', 400);
        }

        if (!Auth::attempt($username, $password)) {
            return apiFail('Invalid credentials', 401);
        }

        return apiOk(['user' => Auth::user()]);
    });

    $api->get('/auth/me', static fn(): array => apiOk(['user' => Auth::user()]), [$auth]);
    $api->post('/auth/logout', static function (): array {
        Auth::logout();
        return apiOk(['message' => 'Logged out']);
    }, [$auth]);

    $api->post('/auth/change-password', static function (array $request): array {
        $payload = body($request);
        $current = (string) ($payload['currentPassword'] ?? '');
        $next = (string) ($payload['newPassword'] ?? '');

        if ($current === '' || $next === '') {
            return apiFail('Current and new password are required', 400);
        }

        $user = User::findById((string) Auth::user()['id']);
        if (!$user || !User::verifyPassword($user, $current)) {
            return apiFail('Current password is incorrect', 400);
        }

        User::updatePassword((string) $user['id'], $next);
        return apiOk(['message' => 'Password updated']);
    }, [$auth, $admin]);

    $api->post('/auth/verify-password', static function (array $request): array {
        $payload = body($request);
        $password = (string) ($payload['password'] ?? '');
        $user = User::findById((string) Auth::user()['id']);

        if (!$user || !User::verifyPassword($user, $password)) {
            return apiFail('Incorrect password', 401);
        }

        return apiOk(['valid' => true]);
    }, [$auth]);

    // Users (admin)
    $api->get('/users', static fn(): array => apiOk(['users' => User::findTeamMembers()]), [$auth, $admin]);

    $api->post('/users', static function (array $request): array {
        $payload = body($request);
        $name = trim((string) ($payload['name'] ?? ''));
        $username = trim((string) ($payload['username'] ?? ''));
        $password = (string) ($payload['password'] ?? '');
        $role = (string) ($payload['role'] ?? 'cashier');

        if ($name === '' || $username === '' || $password === '') {
            return apiFail('Name, username, and password are required', 400);
        }

        if (!in_array($role, ['admin', 'cashier', 'manager'], true)) {
            return apiFail('Invalid role', 400);
        }

        if (User::findByUsername($username)) {
            return apiFail('Username already exists', 409);
        }

        $user = User::create(compact('name', 'username', 'password', 'role'));
        return apiOk(['user' => Auth::toPublicUser($user ?? [])], 201);
    }, [$auth, $admin]);

    $api->delete('/users/:id', static function (array $request, array $params): array {
        $id = (string) ($params['id'] ?? '');
        if ($id === (Auth::user()['id'] ?? '')) {
            return apiFail('Cannot delete your own account', 400);
        }

        if (!User::delete($id)) {
            return apiFail('User not found', 404);
        }

        return apiOk(['message' => 'User deleted']);
    }, [$auth, $admin]);

    $api->patch('/users/:id/password', static function (array $request, array $params): array {
        $password = (string) (body($request)['password'] ?? '');
        if ($password === '') {
            return apiFail('Password is required', 400);
        }

        if (!User::findById((string) $params['id'])) {
            return apiFail('User not found', 404);
        }

        User::updatePassword((string) $params['id'], $password);
        return apiOk(['message' => 'Password reset']);
    }, [$auth, $admin]);

    // Products
    $api->get('/products', static fn(): array => apiOk(['products' => Product::findAll()]), [$auth]);
    $api->get('/products/barcode/:barcode', static function (array $request, array $params): array {
        $product = Product::findByBarcode((string) $params['barcode']);
        if (!$product) {
            return apiFail('Product not found', 404);
        }
        return apiOk(['product' => $product]);
    }, [$auth]);

    $api->post('/products', static function (array $request): array {
        $payload = body($request);
        if (empty($payload['barcode']) || empty($payload['name'])) {
            return apiFail('Barcode and name are required', 400);
        }
        if (Product::barcodeTaken((string) $payload['barcode'])) {
            return apiFail('Barcode already exists', 409);
        }

        $product = Product::create($payload);
        return apiOk(['product' => $product], 201);
    }, [$auth]);

    $api->put('/products/:id', static function (array $request, array $params): array {
        $payload = body($request);
        $id = (string) $params['id'];

        if (isset($payload['barcode']) && Product::barcodeTaken((string) $payload['barcode'], $id)) {
            return apiFail('Barcode already exists', 409);
        }

        if (!Product::update($id, $payload)) {
            return apiFail('Product not found', 404);
        }

        return apiOk(['product' => Product::findById($id)]);
    }, [$auth]);

    $api->delete('/products/:id', static function (array $request, array $params): array {
        if (!Product::delete((string) $params['id'])) {
            return apiFail('Product not found', 404);
        }
        return apiOk(['message' => 'Product deleted']);
    }, [$auth]);

    // Groups
    $api->get('/groups', static fn(): array => apiOk(['groups' => Group::findAll()]), [$auth]);

    $api->post('/groups', static function (array $request): array {
        $name = trim((string) (body($request)['name'] ?? ''));
        if ($name === '') {
            return apiFail('Name is required', 400);
        }
        if (Group::nameExists($name)) {
            return apiFail('Group already exists', 409);
        }
        return apiOk(['group' => Group::create($name)], 201);
    }, [$auth]);

    $api->put('/groups/:id', static function (array $request, array $params): array {
        $name = trim((string) (body($request)['name'] ?? ''));
        $id = (string) $params['id'];
        if ($name === '') {
            return apiFail('Name is required', 400);
        }
        if (Group::nameExists($name, $id)) {
            return apiFail('Group already exists', 409);
        }
        if (!Group::update($id, $name)) {
            return apiFail('Group not found', 404);
        }
        return apiOk(['group' => Group::findById($id)]);
    }, [$auth]);

    $api->delete('/groups/:id', static function (array $request, array $params): array {
        Group::delete((string) $params['id']);
        return apiOk(['message' => 'Group deleted']);
    }, [$auth]);

    $api->post('/groups/:id/subcategories', static function (array $request, array $params): array {
        $name = trim((string) (body($request)['name'] ?? ''));
        $groupId = (string) $params['id'];
        if ($name === '') {
            return apiFail('Name is required', 400);
        }
        if (!Group::findById($groupId)) {
            return apiFail('Group not found', 404);
        }
        if (Group::subcategoryNameExists($groupId, $name)) {
            return apiFail('Subcategory already exists', 409);
        }
        return apiOk(['subcategory' => Group::addSubcategory($groupId, $name)], 201);
    }, [$auth]);

    $api->put('/groups/:groupId/subcategories/:subcategoryId', static function (array $request, array $params): array {
        $name = trim((string) (body($request)['name'] ?? ''));
        if ($name === '') {
            return apiFail('Name is required', 400);
        }
        if (!Group::updateSubcategory((string) $params['groupId'], (string) $params['subcategoryId'], $name)) {
            return apiFail('Subcategory not found', 404);
        }
        return apiOk(['group' => Group::findById((string) $params['groupId'])]);
    }, [$auth]);

    $api->delete('/groups/:groupId/subcategories/:subcategoryId', static function (array $request, array $params): array {
        Group::deleteSubcategory((string) $params['groupId'], (string) $params['subcategoryId']);
        return apiOk(['message' => 'Subcategory deleted']);
    }, [$auth]);

    // Batches
    $api->get('/batches', static fn(): array => apiOk(['batches' => Batch::findAll()]), [$auth]);

    $api->post('/batches', static function (array $request): array {
        $name = trim((string) (body($request)['name'] ?? ''));
        if ($name === '') {
            return apiFail('Name is required', 400);
        }
        if (Batch::nameExists($name)) {
            return apiFail('Batch already exists', 409);
        }
        return apiOk(['batch' => Batch::create($name)], 201);
    }, [$auth]);

    $api->delete('/batches/:id', static function (array $request, array $params): array {
        Batch::delete((string) $params['id']);
        return apiOk(['message' => 'Batch deleted']);
    }, [$auth]);

    // Orders
    $api->get('/orders', static fn(): array => apiOk(['orders' => Order::findAll()]), [$auth]);

    $api->post('/orders', static function (array $request): array {
        $payload = body($request);
        $items = $payload['items'] ?? [];
        if (!is_array($items) || $items === []) {
            return apiFail('Order items are required', 400);
        }

        $order = Order::create($payload, Auth::user());
        Product::deductStockForOrder($items);

        Audit::log('order_created', 'billing', 'Order ' . ($order['id'] ?? ''), Auth::user());

        return apiOk(['order' => $order], 201);
    }, [$auth]);

    // Settings
    $api->get('/settings', static fn(): array => apiOk(['settings' => Settings::get()]), [$auth]);
    $api->put('/settings', static function (array $request): array {
        $settings = Settings::update(body($request));
        return apiOk(['settings' => $settings]);
    }, [$auth]);

    // Audit
    $api->get('/audit', static function (array $request): array {
        $category = trim((string) ($request['query']['category'] ?? ''));
        $entries = AuditLog::findAll(['category' => $category !== '' ? $category : null]);
        return apiOk(['entries' => $entries]);
    }, [$auth, $admin]);

    $api->post('/audit', static function (array $request): array {
        $payload = body($request);
        $action = trim((string) ($payload['action'] ?? ''));
        if ($action === '') {
            return apiFail('Action is required', 400);
        }

        $entry = AuditLog::create([
            'action' => $action,
            'category' => (string) ($payload['category'] ?? 'system'),
            'details' => (string) ($payload['details'] ?? ''),
            'actor' => Auth::user(),
        ]);

        return apiOk(['entry' => $entry], 201);
    }, [$auth]);

    $api->delete('/audit', static function (): array {
        AuditLog::clear();
        return apiOk(['message' => 'Audit log cleared']);
    }, [$auth, $admin]);

    // Store bootstrap / maintenance
    $api->get('/store/bootstrap', static fn(): array => apiOk([
        'products' => Product::findAll(),
        'groups' => Group::findAll(),
        'batches' => Batch::findAll(),
        'orders' => Order::findAll(),
        'settings' => Settings::get(),
    ]), [$auth]);

    $api->post('/store/erase', static function (): array {
        Product::deleteAll();
        Order::deleteAll();
        Group::deleteAll();
        Batch::deleteAll();
        Settings::reset();

        Audit::log(
            'data_erased',
            'settings',
            'All products, orders, categories, batches, and settings reset',
            Auth::user()
        );

        return apiOk(['message' => 'All data erased']);
    }, [$auth, $admin]);

    $api->post('/store/purge', static function (array $request): array {
        $payload = body($request);
        $flags = [
            'products' => (bool) ($payload['products'] ?? false),
            'categories' => (bool) ($payload['categories'] ?? false),
            'batches' => (bool) ($payload['batches'] ?? false),
            'orders' => (bool) ($payload['orders'] ?? false),
            'settings' => (bool) ($payload['settings'] ?? false),
            'auditLog' => (bool) ($payload['auditLog'] ?? false),
        ];

        if ($flags['products']) {
            Product::deleteAll();
        }
        if ($flags['orders']) {
            Order::deleteAll();
        }
        if ($flags['categories']) {
            Group::deleteAll();
        }
        if ($flags['batches']) {
            Batch::deleteAll();
        }
        if ($flags['settings']) {
            Settings::reset();
        }
        if ($flags['auditLog']) {
            AuditLog::clear();
        }

        $removed = array_values(array_filter([
            $flags['products'] ? 'products' : null,
            $flags['categories'] ? 'categories' : null,
            $flags['batches'] ? 'batches' : null,
            $flags['orders'] ? 'orders' : null,
            $flags['settings'] ? 'settings' : null,
            $flags['auditLog'] ? 'audit log' : null,
        ]));

        if ($removed !== []) {
            Audit::log(
                count($removed) >= 4 ? 'data_erased' : 'data_purged',
                'settings',
                'Removed: ' . implode(', ', $removed),
                Auth::user()
            );
        }

        return apiOk(['message' => 'Selected data removed']);
    }, [$auth, $admin]);

    // Support tickets
    $api->get('/support/tickets', static function (array $request): array {
        $status = (string) ($request['query']['status'] ?? 'all');
        return apiOk(['tickets' => SupportTicket::findAll(['status' => $status])]);
    }, [$auth]);

    $api->post('/support/tickets', static function (array $request): array {
        $payload = body($request);
        if (trim((string) ($payload['subject'] ?? '')) === '' || trim((string) ($payload['description'] ?? '')) === '') {
            return apiFail('Subject and description are required', 400);
        }

        $ticket = SupportTicket::create($payload, Auth::user());
        return apiOk(['ticket' => $ticket], 201);
    }, [$auth]);

    $api->patch('/support/tickets/:id/status', static function (array $request, array $params): array {
        $status = (string) (body($request)['status'] ?? '');
        if (!in_array($status, ['open', 'in-progress', 'resolved'], true)) {
            return apiFail('Invalid status', 400);
        }

        if (!SupportTicket::updateStatus((string) $params['id'], $status)) {
            return apiFail('Ticket not found', 404);
        }

        return apiOk(['ticket' => SupportTicket::findById((string) $params['id'])]);
    }, [$auth]);

    $api->delete('/support/tickets', static function (): array {
        SupportTicket::clearAll();
        return apiOk(['message' => 'All tickets cleared']);
    }, [$auth, $admin]);
});

return $router;
