# Deploy on cPanel (PHP + MySQL)

This app runs on **standard cPanel PHP hosting** — no Node.js app setup needed.

## 1. Create MySQL database

1. **cPanel → MySQL Databases**
2. Create database: e.g. `billing`
3. Create user with a strong password
4. Add user to database with **ALL PRIVILEGES**
5. Note: host, database name, username, password

## 2. Upload files

Upload the **`billing`** folder to your account.

**Recommended layout:**

```
public_html/billing-mithras/
  public/          ← document root (index.php, .htaccess, assets/)
  app/
  views/
  config/
  database/
  vendor/
  .env
```

Set document root to `billing/public` or move `public/*` into your web folder.

## 3. Configure `.env`

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_HOST=localhost
DB_NAME=youruser_billing
DB_USER=youruser_dbuser
DB_PASS=your_db_password

INITIAL_ADMIN_USERNAME=naga
INITIAL_ADMIN_PASSWORD=YourSecurePassword123
INITIAL_ADMIN_NAME=Admin
```

## 4. Install database

```bash
cd ~/public_html/billing-mithras
composer install
php database/install.php
```

If `composer` is unavailable on the server, run `composer install` locally and upload `vendor/`.

## 5. Verify

- Open your site → login page
- Sign in and test POS / Billing
- `/api/health` → `{"ok":true,"service":"billing-api"}`

## Troubleshooting

| Problem | Fix |
|--------|-----|
| 500 error | Set `APP_DEBUG=true` in `.env`, check cPanel error log |
| Database failed | Verify `DB_*` in `.env` (host usually `localhost`) |
| CSS 404 | Document root must point to `public/` |
| POS checkout fails | Check browser console; session cookie required for `/api/orders` |

Back up MySQL via **phpMyAdmin → Export** regularly.
