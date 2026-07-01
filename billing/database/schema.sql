-- Billing software schema (MySQL 8+)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) NOT NULL,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'cashier', 'manager') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS groups (
  id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_groups_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subcategories (
  id VARCHAR(64) NOT NULL,
  group_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subcategories_group_name (group_id, name),
  CONSTRAINT fk_subcategories_group FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS batches (
  id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_batches_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) NOT NULL,
  barcode VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  hsn VARCHAR(32) NOT NULL DEFAULT '',
  gst DECIMAL(6,2) NOT NULL DEFAULT 0,
  group_id VARCHAR(64) NULL,
  subcategory_id VARCHAR(64) NULL,
  category VARCHAR(255) NOT NULL DEFAULT '',
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock DECIMAL(12,3) NOT NULL DEFAULT 0,
  mrp DECIMAL(12,2) NULL,
  cost_price DECIMAL(12,2) NULL,
  batch VARCHAR(255) NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  batches_json JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_barcode (barcode),
  KEY idx_products_group (group_id),
  CONSTRAINT fk_products_group FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE SET NULL,
  CONSTRAINT fk_products_subcategory FOREIGN KEY (subcategory_id) REFERENCES subcategories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) NOT NULL,
  date DATETIME NOT NULL,
  created_by_id VARCHAR(64) NULL,
  created_by_json JSON NULL,
  customer_name VARCHAR(255) NOT NULL DEFAULT '',
  customer_mobile VARCHAR(32) NOT NULL DEFAULT '',
  items_json JSON NOT NULL,
  gross_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_before_bill_discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  bill_discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  bill_discount_type VARCHAR(16) NOT NULL DEFAULT 'amount',
  bill_discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_orders_date (date DESC),
  CONSTRAINT fk_orders_user FOREIGN KEY (created_by_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  id TINYINT NOT NULL,
  store_name VARCHAR(255) NOT NULL DEFAULT 'SuperMart Billing',
  store_address TEXT NOT NULL DEFAULT '',
  store_gstin VARCHAR(32) NOT NULL DEFAULT '',
  store_website VARCHAR(255) NOT NULL DEFAULT '',
  store_upi_id VARCHAR(255) NOT NULL DEFAULT '',
  tax_rate DECIMAL(6,2) NOT NULL DEFAULT 5,
  currency VARCHAR(8) NOT NULL DEFAULT '₹',
  discount_enabled TINYINT(1) NOT NULL DEFAULT 1,
  discount_type VARCHAR(16) NOT NULL DEFAULT 'percent',
  max_discount_percent DECIMAL(6,2) NOT NULL DEFAULT 50,
  bill_discount_enabled TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT chk_settings_singleton CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_log (
  id VARCHAR(64) NOT NULL,
  at DATETIME NOT NULL,
  action VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL DEFAULT 'system',
  details TEXT NOT NULL,
  actor_json JSON NULL,
  PRIMARY KEY (id),
  KEY idx_audit_at (at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_tickets (
  id VARCHAR(64) NOT NULL,
  ticket_no VARCHAR(32) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(32) NOT NULL DEFAULT 'billing',
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  status ENUM('open', 'in-progress', 'resolved') NOT NULL DEFAULT 'open',
  created_by_id VARCHAR(64) NULL,
  created_by_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_support_tickets_ticket_no (ticket_no),
  KEY idx_support_tickets_status (status),
  CONSTRAINT fk_support_tickets_user FOREIGN KEY (created_by_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
