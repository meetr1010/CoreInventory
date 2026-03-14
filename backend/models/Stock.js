// backend/models/Stock.js
// Queries to read and mutate current on-hand stock levels.
// ─────────────────────────────────────────────────────────────
// IMPORTANT: Do NOT call Stock.adjust() directly from controllers.
//            Always go through the operation service (Receipt /
//            Delivery / Transfer) so a StockMovement record is
//            created atomically within the same transaction.
// ─────────────────────────────────────────────────────────────

'use strict';

const pool = require('../config/db');

const Stock = {
  // ── SELECT ─────────────────────────────────────────────────

  /**
   * Get the stock record for a specific product in a specific warehouse.
   * Returns null when no row exists (quantity implicitly = 0).
   */
  async findOne(productId, warehouseId) {
    const [rows] = await pool.query(
      `SELECT product_id, warehouse_id, quantity, updated_at
         FROM stock
        WHERE product_id = ? AND warehouse_id = ?
        LIMIT 1`,
      [productId, warehouseId]
    );
    return rows[0] || null;
  },

  /**
   * Get all stock rows for a product across every warehouse.
   * Useful for computing global on-hand total.
   */
  async findByProduct(productId) {
    const [rows] = await pool.query(
      `SELECT s.product_id, s.warehouse_id, s.quantity, s.updated_at,
              w.name AS warehouse_name, w.code AS warehouse_code
         FROM stock s
         JOIN warehouses w ON w.id = s.warehouse_id
        WHERE s.product_id = ?
        ORDER BY w.name ASC`,
      [productId]
    );
    return rows;
  },

  /**
   * Get all stock rows for a warehouse across every product.
   */
  async findByWarehouse(warehouseId) {
    const [rows] = await pool.query(
      `SELECT s.product_id, s.warehouse_id, s.quantity, s.updated_at,
              p.name AS product_name, p.sku, p.uom,
              p.min_stock, p.reorder_qty
         FROM stock s
         JOIN products   p ON p.id = s.product_id
         JOIN warehouses w ON w.id = s.warehouse_id
        WHERE s.warehouse_id = ? AND p.is_active = 1
        ORDER BY p.name ASC`,
      [warehouseId]
    );
    return rows;
  },

  /**
   * Aggregate global stock per product (sum across all warehouses).
   */
  async globalSummary() {
    const [rows] = await pool.query(
      `SELECT p.id AS product_id, p.name, p.sku, p.uom,
              p.min_stock, p.reorder_qty,
              COALESCE(SUM(s.quantity), 0) AS total_quantity
         FROM products p
         LEFT JOIN stock s ON s.product_id = p.id
        WHERE p.is_active = 1
        GROUP BY p.id
        ORDER BY p.name ASC`
    );
    return rows;
  },

  // ── UPSERT / ADJUST ────────────────────────────────────────

  /**
   * Atomically adjust the stock quantity using INSERT … ON DUPLICATE KEY.
   * delta > 0 → increase (receipt / transfer_in)
   * delta < 0 → decrease (delivery / transfer_out)
   *
   * Throws if the resulting quantity would go negative.
   * MUST be called inside a database transaction.
   *
   * @param {Object}  conn       - mysql2 connection (from pool.getConnection())
   * @param {number}  productId
   * @param {number}  warehouseId
   * @param {number}  delta       - signed quantity change
   */
  async adjust(conn, productId, warehouseId, delta) {
    // First ensure the row exists (upsert with 0 baseline)
    await conn.query(
      `INSERT INTO stock (product_id, warehouse_id, quantity)
       VALUES (?, ?, 0)
       ON DUPLICATE KEY UPDATE product_id = product_id`, // no-op on conflict
      [productId, warehouseId]
    );

    if (delta < 0) {
      // Guard against negative stock
      const [check] = await conn.query(
        `SELECT quantity FROM stock WHERE product_id = ? AND warehouse_id = ? FOR UPDATE`,
        [productId, warehouseId]
      );
      const current = Number(check[0]?.quantity ?? 0);
      if (current + delta < 0) {
        throw Object.assign(
          new Error(`Insufficient stock: available ${current}, requested ${Math.abs(delta)}`),
          { status: 409 }
        );
      }
    }

    const [result] = await conn.query(
      `UPDATE stock
          SET quantity = quantity + ?
        WHERE product_id = ? AND warehouse_id = ?`,
      [delta, productId, warehouseId]
    );
    return result.affectedRows;
  },

  /**
   * Hard-set the stock quantity (used for inventory adjustments / cycle counts).
   * MUST be called inside a database transaction.
   *
   * @param {Object} conn
   * @param {number} productId
   * @param {number} warehouseId
   * @param {number} newQty
   */
  async setAbsolute(conn, productId, warehouseId, newQty) {
    const [result] = await conn.query(
      `INSERT INTO stock (product_id, warehouse_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
      [productId, warehouseId, newQty]
    );
    return result.affectedRows;
  },
};

module.exports = Stock;
