# Billing Backend (Node.js MVC + SQLite)

REST API for the billing/POS frontend. Uses **Model–View–Controller** layout with **SQLite** (standard SQL).

## Stack

- **Node.js** + **Express**
- **SQLite** via `better-sqlite3`
- **JWT** authentication
- **bcrypt** password hashing

## Project structure

```
backend/
  src/
    config/          # env + database connection
    database/        # SQL schema, init, seed
    models/          # Data access (MVC Models)
    controllers/     # Request handlers (MVC Controllers)
    routes/          # HTTP routes
    middleware/      # Auth, errors
    utils/
    app.js           # Express app
    server.js        # Entry point
```

## Quick start

```bash
cd backend
cp .env.example .env
npm install
npm run db:reset    # create DB + seed store data
npm run dev         # http://localhost:4000
```

Set `INITIAL_ADMIN_PASSWORD` in `.env` before `db:reset` to create the first admin account.

## API overview

All routes except login require header:

```
Authorization: Bearer <token>
```

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/store/bootstrap` | Load products, groups, batches, orders, settings |
| GET/POST | `/api/products` | List / create products |
| PUT/DELETE | `/api/products/:id` | Update / delete |
| GET | `/api/products/barcode/:code` | Lookup by barcode |
| GET/POST | `/api/groups` | Categories |
| POST | `/api/groups/:id/subcategories` | Add subcategory |
| GET/POST | `/api/batches` | Batch catalog |
| GET/POST | `/api/orders` | Bills (POST deducts stock) |
| GET/PUT | `/api/settings` | Store settings |
| GET/POST/DELETE | `/api/audit` | Audit log (admin) |
| GET/POST/DELETE | `/api/users` | Team management (admin) |

## Connect the frontend

1. Start the API: `npm run dev` (port 4000)
2. In `frontend/.env`:

```
VITE_API_URL=http://localhost:4000/api
```

3. Start the frontend: `cd frontend && npm run dev`

The Vite dev server proxies `/api` to the backend when using the default Vite config.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with auto-reload |
| `npm start` | Production start |
| `npm run db:init` | Apply SQL schema |
| `npm run db:seed` | Seed store data |
| `npm run db:reset` | Init + seed |

## Production notes

- Set a strong `JWT_SECRET` in `.env`
- Back up `data/billing.db` regularly
- For MySQL/PostgreSQL later, swap `config/db.js` and adjust `schema.sql` types
