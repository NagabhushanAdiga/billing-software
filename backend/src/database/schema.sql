-- Billing software schema (SQLite)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cashier', 'manager')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE
);

CREATE TABLE IF NOT EXISTS subcategories (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  UNIQUE (group_id, name COLLATE NOCASE)
);

CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  barcode TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  hsn TEXT NOT NULL DEFAULT '',
  gst REAL NOT NULL DEFAULT 0,
  group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
  subcategory_id TEXT REFERENCES subcategories(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT '',
  discount REAL NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  stock REAL NOT NULL DEFAULT 0,
  mrp REAL,
  cost_price REAL,
  batch TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  batches_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  created_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_by_json TEXT,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_mobile TEXT NOT NULL DEFAULT '',
  items_json TEXT NOT NULL,
  gross_subtotal REAL NOT NULL DEFAULT 0,
  discount_total REAL NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0,
  tax REAL NOT NULL DEFAULT 0,
  total_before_bill_discount REAL NOT NULL DEFAULT 0,
  bill_discount REAL NOT NULL DEFAULT 0,
  bill_discount_type TEXT NOT NULL DEFAULT 'amount',
  bill_discount_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  store_name TEXT NOT NULL DEFAULT 'SuperMart Billing',
  store_address TEXT NOT NULL DEFAULT '',
  store_gstin TEXT NOT NULL DEFAULT '',
  store_website TEXT NOT NULL DEFAULT '',
  store_upi_id TEXT NOT NULL DEFAULT '',
  tax_rate REAL NOT NULL DEFAULT 5,
  currency TEXT NOT NULL DEFAULT '₹',
  discount_enabled INTEGER NOT NULL DEFAULT 1,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  max_discount_percent REAL NOT NULL DEFAULT 50,
  bill_discount_enabled INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL,
  action TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'system',
  details TEXT NOT NULL DEFAULT '',
  actor_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_group ON products(group_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_at ON audit_log(at DESC);
