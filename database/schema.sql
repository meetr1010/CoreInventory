-- ═══════════════════════════════════════════════════════════════
--  IMS – database/schema.sql
--  Full relational schema for the Inventory Management System.
--  Run:  mysql -u root -p < database/schema.sql
-- ═══════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS ims_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE ims_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS stock;
DROP TABLE IF EXISTS transfer_lines;
DROP TABLE IF EXISTS transfers;
DROP TABLE IF EXISTS delivery_lines;
DROP TABLE IF EXISTS deliveries;
DROP TABLE IF EXISTS receipt_lines;
DROP TABLE IF EXISTS receipts;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS warehouses;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ── Users ──────────────────────────────────────────────────────
-- Role ENUM: Admin, Manager, Staff, Viewer
CREATE TABLE users (
  id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(180) NOT NULL UNIQUE,
  phone         VARCHAR(30),
  role          ENUM('Admin','Manager','Staff','Viewer') NOT NULL DEFAULT 'Staff',
  password_hash VARCHAR(255),
  otp_secret    VARCHAR(64),
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Warehouses ─────────────────────────────────────────────────
CREATE TABLE warehouses (
  id         INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  code       VARCHAR(20)  NOT NULL UNIQUE,
  address    VARCHAR(255),
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Products ───────────────────────────────────────────────────
-- min_stock:   triggers low-stock alert when quantity drops below this
-- reorder_qty: suggested replenishment quantity
CREATE TABLE products (
  id           INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(180)  NOT NULL,
  sku          VARCHAR(60)   NOT NULL UNIQUE,
  category     VARCHAR(80),
  uom          VARCHAR(30)   NOT NULL DEFAULT 'pcs',
  description  TEXT,
  min_stock    INT           NOT NULL DEFAULT 0  COMMENT 'Low-stock threshold',
  reorder_qty  INT           NOT NULL DEFAULT 0  COMMENT 'Suggested reorder quantity',
  unit_cost    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  is_active    TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sku      (sku),
  INDEX idx_category (category)
);

-- ── Stock ──────────────────────────────────────────────────────
-- Composite PK: one row per (product, warehouse) combination.
CREATE TABLE stock (
  product_id   INT NOT NULL,
  warehouse_id INT NOT NULL,
  quantity     INT NOT NULL DEFAULT 0,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, warehouse_id),
  FOREIGN KEY (product_id)   REFERENCES products(id)   ON DELETE CASCADE,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- ── StockMovements (Immutable Ledger) ──────────────────────────
-- Every stock change is recorded here. Records are NEVER deleted or updated.
CREATE TABLE stock_movements (
  id             INT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_id     INT      NOT NULL,
  warehouse_id   INT      NOT NULL,
  movement_type  ENUM('receipt','delivery','transfer_out','transfer_in','adjustment')
                          NOT NULL,
  quantity       INT      NOT NULL  COMMENT 'Always positive; direction inferred from type',
  reference_id   INT               COMMENT 'FK to receipts/deliveries/transfers.id',
  reference_type VARCHAR(30)       COMMENT 'receipt | delivery | transfer | adjustment',
  performed_by   INT      NOT NULL,
  notes          TEXT,
  moved_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id)   REFERENCES products(id)   ON DELETE CASCADE,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id)      ON DELETE CASCADE,
  INDEX idx_product   (product_id),
  INDEX idx_warehouse (warehouse_id),
  INDEX idx_moved_at  (moved_at),
  INDEX idx_ref       (reference_type, reference_id)
);

-- ── Receipts ───────────────────────────────────────────────────
CREATE TABLE receipts (
  id           INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  reference    VARCHAR(60)  NOT NULL UNIQUE,
  warehouse_id INT          NOT NULL,
  status       ENUM('draft','confirmed','canceled') NOT NULL DEFAULT 'draft',
  received_by  INT          NOT NULL,
  notes        TEXT,
  received_at  DATETIME,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (received_by)  REFERENCES users(id)
);

CREATE TABLE receipt_lines (
  id           INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  receipt_id   INT NOT NULL,
  product_id   INT NOT NULL,
  expected_qty INT NOT NULL DEFAULT 0,
  received_qty INT NOT NULL DEFAULT 0,
  FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ── Deliveries ─────────────────────────────────────────────────
CREATE TABLE deliveries (
  id             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  reference      VARCHAR(60)  NOT NULL UNIQUE,
  warehouse_id   INT          NOT NULL,
  status         ENUM('draft','confirmed','canceled') NOT NULL DEFAULT 'draft',
  dispatched_by  INT          NOT NULL,
  destination    VARCHAR(180),
  notes          TEXT,
  dispatched_at  DATETIME,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id)  REFERENCES warehouses(id),
  FOREIGN KEY (dispatched_by) REFERENCES users(id)
);

CREATE TABLE delivery_lines (
  id            INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  delivery_id   INT NOT NULL,
  product_id    INT NOT NULL,
  expected_qty  INT NOT NULL DEFAULT 0,
  delivered_qty INT NOT NULL DEFAULT 0,
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id)  REFERENCES products(id)
);

-- ── Transfers ──────────────────────────────────────────────────
CREATE TABLE transfers (
  id                INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  reference         VARCHAR(60)  NOT NULL UNIQUE,
  from_warehouse_id INT          NOT NULL,
  to_warehouse_id   INT          NOT NULL,
  status            ENUM('draft','confirmed','canceled') NOT NULL DEFAULT 'draft',
  transferred_by    INT          NOT NULL,
  notes             TEXT,
  transferred_at    DATETIME,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (to_warehouse_id)   REFERENCES warehouses(id),
  FOREIGN KEY (transferred_by)    REFERENCES users(id)
);

CREATE TABLE transfer_lines (
  id           INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  transfer_id  INT NOT NULL,
  product_id   INT NOT NULL,
  quantity     INT NOT NULL DEFAULT 0,
  FOREIGN KEY (transfer_id) REFERENCES transfers(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id)  REFERENCES products(id)
);
