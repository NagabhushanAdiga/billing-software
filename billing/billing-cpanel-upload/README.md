# SuperMart Billing (PHP + MySQL)

PHP version of the billing app — same features and styling as the React/Node version, designed for **cPanel** hosting (no Node.js required).

## Requirements

- PHP 8.2+
- MySQL 5.7+ or MariaDB 10.3+
- Apache with `mod_rewrite` (standard on cPanel)
- Composer (on your computer; upload `vendor/` or run `composer install` on server if available)

## Local setup

```bash
cd billing
composer install
cp .env.example .env
```

Create a MySQL database, then edit `.env`:

```env
DB_HOST=127.0.0.1
DB_NAME=billing
DB_USER=root
DB_PASS=your_password
INITIAL_ADMIN_PASSWORD=your_secure_password
```

Install schema and sample data:

```bash
php database/install.php
```

Run the built-in server:

```bash
cd public
php -S localhost:8080
```

Open **http://localhost:8080** and sign in with your admin username/password.

## cPanel deployment (billing-mithras)

**On your Mac** — no Composer needed:

```bash
cd "/Users/santhoshs/Desktop/web projects - naga/billing-software/billing"
npm run prepare-cpanel
```

This creates **`billing-cpanel-upload.zip`**. Upload and extract to `public_html/billing-mithras/`, then follow **`READ_ME_FIRST.txt`**.

## Features

- Dashboard, POS / billing, recent bills, printable invoices
- Products, categories, subcategories, barcodes
- Sales reports, team management, settings
- Audit log, support tickets
- Role-based access (admin, manager, cashier)
- Session authentication + JSON API (`/api/*`) for POS checkout

## Folder structure

```
billing/
  public/          ← web root (index.php, assets)
  app/             ← PHP application code
  views/           ← HTML templates (Tailwind)
  config/
  database/        ← schema.sql, install.php
  vendor/          ← Composer packages
```

## Default login

After `database/install.php`, use the credentials from `.env`:

- Username: `INITIAL_ADMIN_USERNAME` (default `naga`)
- Password: `INITIAL_ADMIN_PASSWORD` (set in `.env` before install)
