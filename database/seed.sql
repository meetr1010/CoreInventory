-- ═══════════════════════════════════════════════════════════════
--  IMS – database/seed.sql
--  Sample data: 4 users (one per role), 2 warehouses,
--  5 products, initial stock, operations, and movement history.
--
--  Run AFTER schema.sql:
--    mysql -u root -p < database/seed.sql
-- ═══════════════════════════════════════════════════════════════

USE ims_db;

-- ── 4 Users (one per role) ─────────────────────────────────────
-- passwords stored as plain text for dev (no bcrypt needed for demo)
INSERT INTO users (name, email, role, password_hash) VALUES
('Admin User',    'admin@ims.com',   'Admin',   'admin123'),
('Karan Gohil',   'manager@ims.com', 'Manager', 'manager123'),
('Ravi Patel',    'staff@ims.com',   'Staff',   'staff123'),
('Ananya Singh',  'viewer@ims.com',  'Viewer',  'viewer123');

-- ── 2 Warehouses ───────────────────────────────────────────────
INSERT INTO warehouses (name, code, address) VALUES
('Main Warehouse',  'WH-MAIN', '12 Industrial Estate, Ahmedabad, Gujarat 380001'),
('East Branch',     'WH-EAST', '45 Sector 7, Gandhinagar, Gujarat 382007');

-- ── 5 Products (with min_stock / reorder_qty) ──────────────────
INSERT INTO products (name, sku, category, uom, description, min_stock, reorder_qty, unit_cost) VALUES
('Laptop - ThinkPad X1',     'ELEC-LAP-001', 'Electronics', 'pcs',  '14-inch business laptop, 16GB RAM, 512GB SSD',   5,  10, 85000.00),
('Wireless Mouse - Logitech','ELEC-MOU-001', 'Electronics', 'pcs',  'Ergonomic wireless mouse with Bluetooth',        10,  20,  3500.00),
('Mechanical Keyboard',      'ELEC-KEY-001', 'Electronics', 'pcs',  'TKL layout, RGB backlight, hot-swappable',        8,  15,  7200.00),
('Ergonomic Office Chair',   'FURN-CHR-001', 'Furniture',   'pcs',  'Mesh back, adjustable armrests & lumbar support', 3,   5, 18500.00),
('A4 Paper Ream - 80gsm',    'STAT-PAP-001', 'Stationery',  'ream', 'Bright white copier paper, 500 sheets',          50, 100,   280.00);

-- ── Initial Stock levels ───────────────────────────────────────
-- (product_id, warehouse_id, quantity)
INSERT INTO stock (product_id, warehouse_id, quantity) VALUES
(1, 1, 20), (1, 2, 8),
(2, 1, 45), (2, 2, 20),
(3, 1, 30), (3, 2, 12),
(4, 1, 6),  (4, 2, 2),
(5, 1, 150),(5, 2, 80);

-- ── Receipts ───────────────────────────────────────────────────
INSERT INTO receipts (reference, warehouse_id, status, received_by, notes, received_at) VALUES
('REC-2025-001', 1, 'confirmed', 1, 'Q1 electronics batch',       '2025-01-15 10:00:00'),
('REC-2025-002', 2, 'confirmed', 2, 'East Branch opening stock',   '2025-01-20 11:00:00'),
('REC-2026-001', 1, 'draft',     2, 'Pending Q1 2026 replenishment', NULL);

INSERT INTO receipt_lines (receipt_id, product_id, expected_qty, received_qty) VALUES
(1, 1, 20, 20), (1, 2, 45, 45), (1, 3, 30, 30),
(2, 4, 6,  6),  (2, 5, 150, 150),
(3, 1, 10, 0),  (3, 3, 15, 0);

-- ── Deliveries ─────────────────────────────────────────────────
INSERT INTO deliveries (reference, warehouse_id, status, dispatched_by, destination, notes, dispatched_at) VALUES
('DEL-2025-001', 1, 'confirmed', 1, 'Head Office Floor 3', 'IT setup for new hires', '2025-02-10 14:00:00'),
('DEL-2025-002', 1, 'confirmed', 2, 'Accounts Department', 'Monthly stationery',     '2025-02-15 13:00:00'),
('DEL-2026-001', 1, 'draft',     3, 'Client Site A',       'Urgent delivery',         NULL);

INSERT INTO delivery_lines (delivery_id, product_id, expected_qty, delivered_qty) VALUES
(1, 1, 5, 5), (1, 2, 10, 10), (1, 3, 5, 5),
(2, 5, 20, 20),
(3, 2, 5, 0),  (3, 3, 3, 0);

-- ── Transfers ──────────────────────────────────────────────────
INSERT INTO transfers (reference, from_warehouse_id, to_warehouse_id, status, transferred_by, notes, transferred_at) VALUES
('TRF-2025-001', 1, 2, 'confirmed', 1, 'Rebalance to East Branch', '2025-03-15 10:00:00'),
('TRF-2026-001', 2, 1, 'draft',     2, 'Return unused chairs',      NULL);

INSERT INTO transfer_lines (transfer_id, product_id, quantity) VALUES
(1, 2, 10), (1, 3, 8),
(2, 4, 1);

-- ── Stock Movements (Immutable Ledger) ─────────────────────────
-- These correspond to the confirmed operations above.
INSERT INTO stock_movements
  (product_id, warehouse_id, movement_type, quantity, reference_id, reference_type, performed_by, notes, moved_at)
VALUES
-- Receipt #1 (Main Warehouse)
(1, 1, 'receipt',      20, 1, 'receipt', 1, 'Initial laptop stock',    '2025-01-15 10:05:00'),
(2, 1, 'receipt',      45, 1, 'receipt', 1, 'Mouse batch received',    '2025-01-15 10:10:00'),
(3, 1, 'receipt',      30, 1, 'receipt', 1, 'Keyboards received',      '2025-01-15 10:15:00'),
-- Receipt #2 (East Branch)
(4, 2, 'receipt',       6, 2, 'receipt', 2, 'Chairs for East Branch',  '2025-01-20 11:05:00'),
(5, 2, 'receipt',     150, 2, 'receipt', 2, 'Paper stock East Branch', '2025-01-20 11:10:00'),
-- Delivery #1 (Main Warehouse)
(1, 1, 'delivery',      5, 1, 'delivery', 1,'IT setup Head Office',    '2025-02-10 14:05:00'),
(2, 1, 'delivery',     10, 1, 'delivery', 1,'Mice for new hires',      '2025-02-10 14:10:00'),
(3, 1, 'delivery',      5, 1, 'delivery', 1,'Keyboards for new hires', '2025-02-10 14:15:00'),
-- Delivery #2
(5, 1, 'delivery',     20, 2, 'delivery', 2,'Stationery Accounts',     '2025-02-15 13:05:00'),
-- Transfer #1 (Main → East)
(2, 1, 'transfer_out', 10, 1, 'transfer', 1,'Transfer to East Branch', '2025-03-15 10:05:00'),
(2, 2, 'transfer_in',  10, 1, 'transfer', 1,'Received from Main WH',   '2025-03-15 10:10:00'),
(3, 1, 'transfer_out',  8, 1, 'transfer', 1,'Transfer to East Branch', '2025-03-15 10:15:00'),
(3, 2, 'transfer_in',   8, 1, 'transfer', 1,'Received from Main WH',   '2025-03-15 10:20:00');
