# Billing Software

Two versions of the same app:

| Folder | Stack | Best for |
|--------|-------|----------|
| **`billing/`** | PHP + MySQL | **cPanel** — upload and run, no Node.js |
| `frontend/` + `backend/` | React + Node.js | Local dev or Node-capable hosting |

## PHP version (recommended for cPanel)

```bash
cd billing
composer install
cp .env.example .env
# Edit .env with MySQL credentials
php database/install.php
cd public && php -S localhost:8080
```

See **`billing/DEPLOY.md`** for cPanel steps.

## Node + React version (local dev)

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```
