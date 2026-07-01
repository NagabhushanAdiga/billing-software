<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Auth;
use App\Helpers\Audit;
use App\Helpers\Billing;
use App\Helpers\Web;
use App\Models\AuditLog;
use App\Models\Batch;
use App\Models\Group;
use App\Models\Order;
use App\Models\Product;
use App\Models\Settings;
use App\Models\SupportTicket;
use App\Models\User;

final class PageController
{
  /**
   * @return array{status: int, body: string|null, headers: array<string, string>}|null
   */
    private static function authPage(string $path, string $view, array $roles, array $extra = []): ?array
    {
        $guard = Web::guardRole($roles);
        if ($guard !== null) {
            return $guard;
        }
        if (!Web::canAccess($path)) {
            return Web::redirect('/');
        }
        return Web::page($view, Web::layoutData($path, $extra));
    }

    public static function dashboard(): ?array
    {
        $guard = Web::guard();
        if ($guard !== null) {
            return $guard;
        }
        $orders = Order::findAll();
        $products = Product::findAll();
        $today = date('Y-m-d');
        $todaySales = 0.0;
        $todayBills = 0;
        foreach ($orders as $order) {
            $d = substr((string) ($order['date'] ?? ''), 0, 10);
            if ($d === $today) {
                $todayBills++;
                $todaySales += (float) ($order['total'] ?? 0);
            }
        }
        return Web::page('pages.dashboard', Web::layoutData('/', [
            'stats' => [
                'products' => count($products),
                'orders' => count($orders),
                'todayBills' => $todayBills,
                'todaySales' => $todaySales,
            ],
            'recentOrders' => array_slice($orders, 0, 5),
        ]));
    }

    public static function loginForm(): ?array
    {
        if (Auth::check()) {
            return Web::redirect('/');
        }
        $error = $_SESSION['login_error'] ?? null;
        unset($_SESSION['login_error']);
        return Web::page('auth.login', ['error' => $error]);
    }

    public static function loginSubmit(): ?array
    {
        $username = trim((string) ($_POST['username'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');
        unset($_SESSION['login_error']);

        if ($username === '' || $password === '') {
            $_SESSION['login_error'] = 'Username and password are required.';
            return Web::redirect('/login');
        }

        if (!Auth::attempt($username, $password)) {
            $_SESSION['login_error'] = 'Invalid username or password.';
            return Web::redirect('/login');
        }

        Audit::log('login', 'auth', 'Signed in as ' . $username, Auth::user());
        return Web::redirect('/');
    }

    public static function logout(): ?array
    {
        if (Auth::check()) {
            Audit::log('logout', 'auth', 'Signed out', Auth::user());
        }
        Auth::logout();
        return Web::redirect('/login');
    }

    public static function pos(): ?array
    {
        return self::authPage('/pos', 'pages.pos', ['admin', 'cashier', 'manager'], [
            'productsJson' => json_encode(Product::findAll(), JSON_THROW_ON_ERROR),
            'settingsJson' => json_encode(Settings::get(), JSON_THROW_ON_ERROR),
        ]);
    }

    public static function recentBills(): ?array
    {
        $user = Auth::user();
        $orders = Order::findAll();
        if (($user['role'] ?? '') !== 'admin') {
            $orders = array_values(array_filter($orders, static function (array $o) use ($user): bool {
                $by = $o['createdBy'] ?? [];
                return ($by['id'] ?? '') === ($user['id'] ?? '') || ($by['username'] ?? '') === ($user['username'] ?? '');
            }));
        }
        return self::authPage('/recent-bills', 'pages.recent-bills', ['admin', 'cashier', 'manager'], [
            'orders' => $orders,
        ]);
    }

    public static function products(): ?array
    {
        return self::authPage('/products', 'pages.products', ['admin', 'manager'], [
            'products' => Product::findAll(),
            'groups' => Group::findAll(),
            'batches' => Batch::findAll(),
        ]);
    }

    public static function productSave(): ?array
    {
        $guard = Web::guardRole(['admin', 'manager']);
        if ($guard !== null) {
            return $guard;
        }
        $id = trim((string) ($_POST['id'] ?? ''));
        $payload = [
            'barcode' => trim((string) ($_POST['barcode'] ?? '')),
            'name' => trim((string) ($_POST['name'] ?? '')),
            'groupId' => trim((string) ($_POST['groupId'] ?? '')),
            'subcategoryId' => trim((string) ($_POST['subcategoryId'] ?? '')),
            'price' => (float) ($_POST['price'] ?? 0),
            'stock' => (float) ($_POST['stock'] ?? 0),
            'discount' => (float) ($_POST['discount'] ?? 0),
            'gst' => (float) ($_POST['gst'] ?? 0),
            'hsn' => trim((string) ($_POST['hsn'] ?? '')),
            'image' => trim((string) ($_POST['image'] ?? '')),
        ];
        if ($payload['barcode'] === '' || $payload['name'] === '') {
            Web::flash('error', 'Barcode and name are required.');
            return Web::redirect('/products');
        }
        if ($id !== '') {
            Product::update($id, $payload);
            Web::flash('success', 'Product updated.');
        } else {
            if (Product::barcodeTaken($payload['barcode'])) {
                Web::flash('error', 'Barcode already exists.');
                return Web::redirect('/products');
            }
            Product::create($payload);
            Web::flash('success', 'Product created.');
        }
        return Web::redirect('/products');
    }

    public static function productDelete(): ?array
    {
        $guard = Web::guardRole(['admin', 'manager']);
        if ($guard !== null) {
            return $guard;
        }
        Product::delete((string) ($_POST['id'] ?? ''));
        Web::flash('success', 'Product deleted.');
        return Web::redirect('/products');
    }

    public static function categories(): ?array
    {
        return self::authPage('/categories', 'pages.categories', ['admin', 'manager'], [
            'groups' => Group::findAll(),
        ]);
    }

    public static function categorySave(): ?array
    {
        $guard = Web::guardRole(['admin', 'manager']);
        if ($guard !== null) {
            return $guard;
        }
        $id = trim((string) ($_POST['id'] ?? ''));
        $name = trim((string) ($_POST['name'] ?? ''));
        if ($name === '') {
            Web::flash('error', 'Name is required.');
            return Web::redirect('/categories');
        }
        if ($id !== '') {
            Group::update($id, $name);
        } else {
            Group::create($name);
        }
        Web::flash('success', 'Category saved.');
        return Web::redirect('/categories');
    }

    public static function categoryDelete(): ?array
    {
        $guard = Web::guardRole(['admin', 'manager']);
        if ($guard !== null) {
            return $guard;
        }
        Group::delete((string) ($_POST['id'] ?? ''));
        Web::flash('success', 'Category deleted.');
        return Web::redirect('/categories');
    }

    public static function subcategories(): ?array
    {
        return self::authPage('/subcategories', 'pages.subcategories', ['admin', 'manager'], [
            'groups' => Group::findAll(),
        ]);
    }

    public static function subcategorySave(): ?array
    {
        $guard = Web::guardRole(['admin', 'manager']);
        if ($guard !== null) {
            return $guard;
        }
        $groupId = trim((string) ($_POST['groupId'] ?? ''));
        $name = trim((string) ($_POST['name'] ?? ''));
        $subId = trim((string) ($_POST['subcategoryId'] ?? ''));
        if ($groupId === '' || $name === '') {
            Web::flash('error', 'Group and name are required.');
            return Web::redirect('/subcategories');
        }
        if ($subId !== '') {
            Group::updateSubcategory($groupId, $subId, $name);
        } else {
            Group::addSubcategory($groupId, $name);
        }
        Web::flash('success', 'Subcategory saved.');
        return Web::redirect('/subcategories');
    }

    public static function subcategoryDelete(): ?array
    {
        $guard = Web::guardRole(['admin', 'manager']);
        if ($guard !== null) {
            return $guard;
        }
        Group::deleteSubcategory(
            (string) ($_POST['groupId'] ?? ''),
            (string) ($_POST['subcategoryId'] ?? '')
        );
        Web::flash('success', 'Subcategory deleted.');
        return Web::redirect('/subcategories');
    }

    public static function barcodes(): ?array
    {
        return self::authPage('/barcodes', 'pages.barcodes', ['admin', 'manager'], [
            'products' => Product::findAll(),
        ]);
    }

    public static function reports(): ?array
    {
        return self::authPage('/reports', 'pages.reports', ['admin', 'manager'], [
            'orders' => Order::findAll(),
            'products' => Product::findAll(),
        ]);
    }

    public static function team(): ?array
    {
        return self::authPage('/team', 'pages.team', ['admin'], [
            'users' => User::findTeamMembers(),
        ]);
    }

    public static function teamSave(): ?array
    {
        $guard = Web::guardRole(['admin']);
        if ($guard !== null) {
            return $guard;
        }
        $name = trim((string) ($_POST['name'] ?? ''));
        $username = trim((string) ($_POST['username'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');
        $role = (string) ($_POST['role'] ?? 'cashier');
        if ($name === '' || $username === '' || $password === '') {
            Web::flash('error', 'All fields are required.');
            return Web::redirect('/team');
        }
        if (User::findByUsername($username)) {
            Web::flash('error', 'Username already exists.');
            return Web::redirect('/team');
        }
        User::create(compact('name', 'username', 'password', 'role'));
        Web::flash('success', 'Team member added.');
        return Web::redirect('/team');
    }

    public static function teamDelete(): ?array
    {
        $guard = Web::guardRole(['admin']);
        if ($guard !== null) {
            return $guard;
        }
        $id = (string) ($_POST['id'] ?? '');
        if ($id === (Auth::user()['id'] ?? '')) {
            Web::flash('error', 'Cannot delete your own account.');
            return Web::redirect('/team');
        }
        User::delete($id);
        Web::flash('success', 'User removed.');
        return Web::redirect('/team');
    }

    public static function settings(): ?array
    {
        return self::authPage('/settings', 'pages.settings', ['admin'], [
            'products' => Product::findAll(),
            'groups' => Group::findAll(),
            'batches' => Batch::findAll(),
            'orders' => Order::findAll(),
            'tickets' => SupportTicket::findAll(),
            'auditEntries' => AuditLog::findAll(),
        ]);
    }

    public static function settingsSave(): ?array
    {
        $guard = Web::guardRole(['admin']);
        if ($guard !== null) {
            return $guard;
        }
        Settings::update([
            'storeName' => trim((string) ($_POST['storeName'] ?? '')),
            'storeAddress' => trim((string) ($_POST['storeAddress'] ?? '')),
            'storeGstin' => strtoupper(trim((string) ($_POST['storeGstin'] ?? ''))),
            'storeWebsite' => trim((string) ($_POST['storeWebsite'] ?? '')),
            'storeUpiId' => trim((string) ($_POST['storeUpiId'] ?? '')),
            'taxRate' => (float) ($_POST['taxRate'] ?? 5),
            'currency' => (string) ($_POST['currency'] ?? '₹'),
            'discountEnabled' => isset($_POST['discountEnabled']),
            'discountType' => (string) ($_POST['discountType'] ?? 'percent'),
            'maxDiscountPercent' => (float) ($_POST['maxDiscountPercent'] ?? 50),
            'billDiscountEnabled' => isset($_POST['billDiscountEnabled']),
        ]);
        Audit::log('settings_updated', 'settings', 'Store settings saved', Auth::user());
        Web::flash('success', 'Settings saved.');
        return Web::redirect('/settings');
    }

    public static function audit(): ?array
    {
        return self::authPage('/audit', 'pages.audit', ['admin'], [
            'entries' => AuditLog::findAll(),
        ]);
    }

    public static function support(): ?array
    {
        return self::authPage('/support', 'pages.support', ['admin', 'cashier', 'manager'], [
            'tickets' => SupportTicket::findAll(),
        ]);
    }

    public static function supportSave(): ?array
    {
        $guard = Web::guard();
        if ($guard !== null) {
            return $guard;
        }
        SupportTicket::create([
            'subject' => trim((string) ($_POST['subject'] ?? '')),
            'description' => trim((string) ($_POST['description'] ?? '')),
            'category' => (string) ($_POST['category'] ?? 'general'),
            'priority' => (string) ($_POST['priority'] ?? 'medium'),
        ], Auth::user());
        Web::flash('success', 'Support ticket created.');
        return Web::redirect('/support');
    }

    public static function invoice(string $id): ?array
    {
        $guard = Web::guard();
        if ($guard !== null) {
            return $guard;
        }
        $order = Order::findById($id);
        if ($order === null) {
            return Web::redirect('/recent-bills');
        }
        return Web::page('pages.invoice', Web::layoutData('/recent-bills', [
            'order' => $order,
            'print' => isset($_GET['print']),
        ]));
    }
}
