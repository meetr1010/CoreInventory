-- ═══════════════════════════════════════════════════════════════
--  IMS Database Schema + Seed Data
--  Run this file in MySQL to create all tables and populate them
--  with sample data for development/demo purposes.
--
--  Usage:  mysql -u root -p < seed.sql
-- ═══════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS ims_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ims_db;

-- ──────────────────────────────────────────────────────────────
--  SCHEMA — drop in reverse dependency order then recreate
-- ──────────────────────────────────────────────────────────────

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS stock;
DROP TABLE IF EXISTS delivery_lines;
DROP TABLE IF EXISTS deliveries;
DROP TABLE IF EXISTS receipt_lines;
DROP TABLE IF EXISTS receipts;
DROP TABLE IF EXISTS transfer_lines;
DROP TABLE IF EXISTS transfers;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS warehouses;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ── Users ──────────────────────────────────────────────────────
CREATE TABLE users (
  id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(180) NOT NULL UNIQUE,
  phone         VARCHAR(30),
  role          ENUM('staff','manager','admin') NOT NULL DEFAULT 'staff',
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
CREATE TABLE products (
  id           INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(180)  NOT NULL,
  sku          VARCHAR(60)   NOT NULL UNIQUE,
  category     VARCHAR(80),
  uom          VARCHAR(30)   NOT NULL DEFAULT 'pcs',
  description  TEXT,
  min_stock    INT           NOT NULL DEFAULT 0,
  reorder_qty  INT           NOT NULL DEFAULT 0,
  unit_cost    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Stock ──────────────────────────────────────────────────────
CREATE TABLE stock (
  id           INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_id   INT NOT NULL,
  warehouse_id INT NOT NULL,
  quantity     INT NOT NULL DEFAULT 0,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_product_warehouse (product_id, warehouse_id),
  FOREIGN KEY (product_id)   REFERENCES products(id)   ON DELETE CASCADE,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- ── Stock Movements ────────────────────────────────────────────
CREATE TABLE stock_movements (
  id             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_id     INT          NOT NULL,
  warehouse_id   INT          NOT NULL,
  movement_type  ENUM('receipt','delivery','transfer_out','transfer_in','adjustment') NOT NULL,
  quantity       INT          NOT NULL,
  reference_id   INT,
  performed_by   INT          NOT NULL,
  notes          TEXT,
  moved_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id)   REFERENCES products(id)   ON DELETE CASCADE,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id)      ON DELETE CASCADE
);

-- ── Receipts ───────────────────────────────────────────────────
CREATE TABLE receipts (
  id           INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  reference    VARCHAR(60)  NOT NULL UNIQUE,
  warehouse_id INT          NOT NULL,
  status       ENUM('draft','waiting','ready','done','canceled') NOT NULL DEFAULT 'draft',
  notes        TEXT,
  created_by   INT          NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (created_by)   REFERENCES users(id)
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
  id           INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  reference    VARCHAR(60)  NOT NULL UNIQUE,
  warehouse_id INT          NOT NULL,
  status       ENUM('draft','waiting','ready','done','canceled') NOT NULL DEFAULT 'draft',
  notes        TEXT,
  created_by   INT          NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (created_by)   REFERENCES users(id)
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
  status            ENUM('draft','waiting','ready','done','canceled') NOT NULL DEFAULT 'draft',
  notes             TEXT,
  created_by        INT          NOT NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (to_warehouse_id)   REFERENCES warehouses(id),
  FOREIGN KEY (created_by)        REFERENCES users(id)
);

CREATE TABLE transfer_lines (
  id           INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  transfer_id  INT NOT NULL,
  product_id   INT NOT NULL,
  quantity     INT NOT NULL DEFAULT 0,
  FOREIGN KEY (transfer_id) REFERENCES transfers(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id)  REFERENCES products(id)
);

-- ══════════════════════════════════════════════════════════════
--  SEED DATA
-- ══════════════════════════════════════════════════════════════

-- ── Users ──────────────────────────────────────────────────────
-- Passwords stored as plain text for dev (prefix 'plain:' signals no bcrypt)
-- In production, replace with bcrypt hashes.
INSERT INTO users (name, email, role, password_hash) VALUES
('Admin User',           'admin@ims.com',      'admin',   'admin123'),
('Karan Gohil',          '8952.stkabirdin@gmail.com', 'manager', 'manager123'),
('Priya Sharma',         'priya@ims.com',       'manager', 'manager123'),
('Ravi Patel',           'ravi@ims.com',        'staff',   'staff123'),
('Ananya Singh',         'ananya@ims.com',      'staff',   'staff123');

-- ── Warehouses ─────────────────────────────────────────────────
INSERT INTO warehouses (name, code, address) VALUES
('Main Warehouse',  'WH-MAIN',  '12, Industrial Estate, Ahmedabad, Gujarat 380001'),
('East Branch',     'WH-EAST',  '45, Sector 7, Gandhinagar, Gujarat 382007'),
('West Branch',     'WH-WEST',  '78, Ring Road, Surat, Gujarat 395001');

-- ── Products ─────────────────────────────────────────────────────
INSERT INTO products (name, sku, category, uom, description, min_stock, reorder_qty, unit_cost) VALUES
-- Electronics
('Laptop - ThinkPad X1 Carbon',     'ELEC-LAP-001', 'Electronics', 'pcs',  '14-inch business laptop, 16GB RAM, 512GB SSD',           5,  10,  85000.00),
('Wireless Mouse - Logitech MX',    'ELEC-MOU-001', 'Electronics', 'pcs',  'Ergonomic wireless mouse with Bluetooth',                10,  20,   3500.00),
('Mechanical Keyboard - Keychron',  'ELEC-KEY-001', 'Electronics', 'pcs',  'TKL layout, RGB backlight, hot-swappable switches',       8,  15,   7200.00),
('27-inch Monitor - Dell UltraSharp','ELEC-MON-001','Electronics', 'pcs',  '4K IPS display, 60Hz refresh rate, USB-C',                5,   8,  32000.00),
('USB-C Hub - 7-in-1',              'ELEC-HUB-001', 'Electronics', 'pcs',  'HDMI, USB 3.0 x3, SD card, PD charging',                 15,  30,   2200.00),
('Webcam - Logitech C920',          'ELEC-CAM-001', 'Electronics', 'pcs',  '1080p HD webcam with built-in microphone',               10,  20,   6500.00),
('Noise Cancelling Headphones',     'ELEC-HDP-001', 'Electronics', 'pcs',  'Over-ear ANC headphones, 30hr battery',                   5,  10,  12500.00),
-- Accessories
('Laptop Bag - 15.6 inch',          'ACC-BAG-001',  'Accessories', 'pcs',  'Water resistant carrying bag with shoulder strap',       20,  40,   1800.00),
('HDMI Cable - 2m',                 'ACC-CBL-001',  'Accessories', 'pcs',  'HDMI 2.0, supports 4K 60Hz',                            30,  60,    650.00),
('Power Strip - 6 sockets',         'ACC-PWR-001',  'Accessories', 'pcs',  'Surge protected, 2m cord, 3 USB ports',                 15,  30,   1100.00),
('Laptop Stand - Adjustable',       'ACC-STD-001',  'Accessories', 'pcs',  'Aluminium stand, 6 height levels, foldable',            10,  20,   2400.00),
('Screen Cleaning Kit',             'ACC-CLN-001',  'Accessories', 'kit',  'Microfiber cloth + spray bottle',                       25,  50,    350.00),
-- Furniture
('Ergonomic Office Chair',          'FURN-CHR-001', 'Furniture',   'pcs',  'Mesh back, adjustable armrests & lumbar support',         3,   5,  18500.00),
('Height-Adjustable Standing Desk', 'FURN-DSK-001', 'Furniture',   'pcs',  'Electric motor, 120×60cm top, memory presets',            3,   5,  24000.00),
('Monitor Arm - Dual Mount',        'FURN-ARM-001', 'Furniture',   'pcs',  'VESA 75/100 compatible, gas spring arm',                  5,  10,   3800.00),
-- Stationery
('A4 Paper Ream - 80gsm',           'STAT-PAP-001', 'Stationery',  'ream', 'Bright white copier paper, 500 sheets',                 50, 100,    280.00),
('Ballpoint Pens - Box of 12',      'STAT-PEN-001', 'Stationery',  'box',  'Blue ink, medium tip, retractable',                     30,  60,    120.00),
('Sticky Notes - Pack of 5',        'STAT-STK-001', 'Stationery',  'pack', '3x3 inch, 5 colours, 100 sheets per pad',               20,  40,     85.00),
-- Networking
('Network Switch - 8 Port',         'NET-SWT-001',  'Networking',  'pcs',  'Gigabit unmanaged switch,  plug-and-play',               5,  10,   3200.00),
('Cat6 Ethernet Cable - 5m',        'NET-CBL-001',  'Networking',  'pcs',  '550 MHz, shielded, RJ45 connectors',                   20,  40,    480.00);

-- ── Stock Levels ────────────────────────────────────────────────
-- (product_id, warehouse_id, quantity)
INSERT INTO stock (product_id, warehouse_id, quantity) VALUES
-- Main Warehouse (WH-MAIN = id 1)
(1,1,15), (2,1,45), (3,1,30), (4,1,12), (5,1,60),
(6,1,25), (7,1,18), (8,1,55), (9,1,80), (10,1,40),
(11,1,22), (12,1,70), (13,1,8),  (14,1,5),  (15,1,10),
(16,1,120),(17,1,200),(18,1,150),(19,1,14), (20,1,50),
-- East Branch (WH-EAST = id 2)
(1,2,8),  (2,2,30), (3,2,15), (4,2,6),  (5,2,35),
(6,2,12), (7,2,9),  (8,2,28), (9,2,50), (10,2,25),
(11,2,10),(12,2,40),(13,2,3),  (14,2,2),  (15,2,5),
(16,2,80),(17,2,100),(18,2,90),(19,2,8),  (20,2,30),
-- West Branch (WH-WEST = id 3)
(1,3,5),  (2,3,20), (3,3,10), (4,3,4),  (5,3,25),
(6,3,8),  (7,3,6),  (8,3,18), (9,3,35), (10,3,18),
(11,3,7), (12,3,30),(13,3,2),  (14,3,2),  (15,3,4),
(16,3,60),(17,3,80),(18,3,70),(19,3,5),  (20,3,20);

-- ── Receipts ───────────────────────────────────────────────────
INSERT INTO receipts (reference, warehouse_id, status, notes, created_by) VALUES
('REC-2025-001', 1, 'done',    'Initial stock receipt Q1 2025 - Electronics batch',   1),
('REC-2025-002', 2, 'done',    'Furniture and accessories for East Branch',             1),
('REC-2025-003', 1, 'done',    'Stationery and networking equipment',                  2),
('REC-2025-004', 3, 'ready',   'Pending validation - Q2 stock replenishment',           2),
('REC-2026-001', 1, 'waiting', 'Q1 2026 replenishment order - awaiting supplier',      2),
('REC-2026-002', 2, 'draft',   'Draft receipt for new laptops batch',                  3);

INSERT INTO receipt_lines (receipt_id, product_id, expected_qty, received_qty) VALUES
(1, 1, 20, 20),(1, 2, 50, 45),(1, 5, 60, 60),(1, 6, 25, 25),
(2, 13, 10, 8),(2, 14, 5, 5),(2, 8, 60, 55),(2, 11, 25, 22),
(3, 16, 120, 120),(3, 17, 200, 200),(3, 19, 15, 14),(3, 20, 50, 50),
(4, 3, 15, 0),(4, 4, 12, 0),(4, 7, 20, 0),
(5, 1, 10, 0),(5, 4, 5, 0),
(6, 1, 15, 0),(6, 3, 10, 0);

-- ── Deliveries ─────────────────────────────────────────────────
INSERT INTO deliveries (reference, warehouse_id, status, notes, created_by) VALUES
('DEL-2025-001', 1, 'done',    'IT setup delivery for Head Office Floor 3',             1),
('DEL-2025-002', 1, 'done',    'Stationery delivery to Accounts Department',            2),
('DEL-2025-003', 2, 'done',    'Conference room setup - East Branch',                   2),
('DEL-2025-004', 1, 'ready',   'Ready for dispatch - Q4 delivery',                      3),
('DEL-2026-001', 1, 'waiting', 'Awaiting pick confirmation',                             2),
('DEL-2026-002', 3, 'draft',   'Draft delivery order for West Branch client',            3);

INSERT INTO delivery_lines (delivery_id, product_id, expected_qty, delivered_qty) VALUES
(1, 1, 5, 5),(1, 2, 10, 10),(1, 3, 5, 5),(1, 6, 5, 5),
(2, 16, 20, 20),(2, 17, 50, 50),(2, 18, 30, 30),
(3, 4, 3, 3),(3, 13, 2, 2),(3, 15, 3, 3),
(4, 7, 3, 0),(4, 8, 10, 0),
(5, 2, 5, 0),(5, 5, 10, 0),
(6, 9, 15, 0),(6, 10, 8, 0);

-- ── Transfers ──────────────────────────────────────────────────
INSERT INTO transfers (reference, from_warehouse_id, to_warehouse_id, status, notes, created_by) VALUES
('TRF-2025-001', 1, 2, 'done',    'Rebalance stock to East Branch - Q3',                 1),
('TRF-2025-002', 1, 3, 'done',    'West Branch opening stock transfer',                   1),
('TRF-2025-003', 2, 3, 'done',    'Surplus electronics moved to West',                    2),
('TRF-2025-004', 1, 2, 'ready',   'Ready to transfer - awaiting transport',               2),
('TRF-2026-001', 3, 1, 'waiting', 'Return unused furniture from West to Main',            3),
('TRF-2026-002', 1, 2, 'draft',   'Draft transfer for accessories rebalance',              3);

INSERT INTO transfer_lines (transfer_id, product_id, quantity) VALUES
(1, 2, 15),(1, 5, 20),(1, 8, 15),
(2, 13, 3),(2, 14, 2),(2, 9, 25),(2, 12, 30),
(3, 1, 3),(3, 6, 5),
(4, 17, 50),(4, 16, 30),
(5, 13, 1),(5, 14, 1),
(6, 2, 10),(6, 11, 5);

-- ── Stock Movements (History) ───────────────────────────────────
INSERT INTO stock_movements (product_id, warehouse_id, movement_type, quantity, reference_id, performed_by, notes, moved_at) VALUES
-- Receipts (movement_type = 'receipt')
(1,  1, 'receipt',     20,   1,  1, 'Initial laptop stock',                  '2025-01-15 09:00:00'),
(2,  1, 'receipt',     45,   1,  1, 'Wireless mouse batch',                  '2025-01-15 09:15:00'),
(5,  1, 'receipt',     60,   1,  1, 'USB-C hubs received',                   '2025-01-15 09:30:00'),
(13, 2, 'receipt',      8,   2,  1, 'Office chairs - East Branch',           '2025-01-20 10:00:00'),
(14, 2, 'receipt',      5,   2,  1, 'Standing desks - East Branch',          '2025-01-20 10:30:00'),
(16, 1, 'receipt',    120,   3,  2, 'A4 paper yearly stock',                 '2025-02-01 11:00:00'),
(17, 1, 'receipt',    200,   3,  2, 'Ballpoint pens bulk order',             '2025-02-01 11:15:00'),
(19, 1, 'receipt',     14,   3,  2, 'Network switches received',             '2025-02-01 11:30:00'),
-- Deliveries (movement_type = 'delivery')
(1,  1, 'delivery',     5,   1,  1, 'IT setup Head Office',                  '2025-02-10 14:00:00'),
(2,  1, 'delivery',    10,   1,  1, 'Mice for Head Office staff',            '2025-02-10 14:15:00'),
(3,  1, 'delivery',     5,   1,  1, 'Keyboards Head Office',                 '2025-02-10 14:30:00'),
(16, 1, 'delivery',    20,   2,  2, 'Stationery to Accounts',                '2025-02-15 13:00:00'),
(17, 1, 'delivery',    50,   2,  2, 'Pens to Accounts',                      '2025-02-15 13:15:00'),
(4,  2, 'delivery',     3,   3,  2, 'Monitors for conference room',          '2025-03-05 15:00:00'),
-- Transfers Out (movement_type = 'transfer_out')
(2,  1, 'transfer_out',15,   1,  1, 'Transfer to East Branch',               '2025-03-15 10:00:00'),
(5,  1, 'transfer_out',20,   1,  1, 'Hubs to East Branch',                   '2025-03-15 10:30:00'),
(9,  1, 'transfer_out',25,   2,  1, 'Cables to West Branch',                 '2025-04-01 09:00:00'),
-- Transfers In (movement_type = 'transfer_in')
(2,  2, 'transfer_in', 15,   1,  1, 'Received from Main Warehouse',          '2025-03-15 11:00:00'),
(5,  2, 'transfer_in', 20,   1,  1, 'Hubs received from Main',               '2025-03-15 11:30:00'),
(9,  3, 'transfer_in', 25,   2,  1, 'Cables received from Main',             '2025-04-01 10:00:00'),
-- Adjustments (movement_type = 'adjustment')
(12, 1, 'adjustment',  -2,   NULL, 2, 'Cycle count correction - damaged',    '2025-05-01 16:00:00'),
(18, 1, 'adjustment',  -5,   NULL, 2, 'Sticky notes count discrepancy',      '2025-05-15 16:00:00'),
(7,  1, 'adjustment',   2,   NULL, 3, 'Found extra units in backstore',      '2025-06-01 14:00:00');
