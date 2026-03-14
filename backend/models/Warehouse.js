// backend/models/Warehouse.js
// Raw SQL queries for Warehouses
// ─────────────────────────────────────────────────────────────

'use strict';

const pool = require('../config/db');

const Warehouse = {
  // ── SELECT ─────────────────────────────────────────────────

  /** Return all active warehouses. */
  async findAll({ includeInactive = false } = {}) {
    const whereClause = includeInactive ? '' : 'WHERE is_active = 1';
    const [rows] = await pool.query(
      `SELECT id, name, code, address, is_active, created_at, updated_at
         FROM warehouses
         ${whereClause}
        ORDER BY name ASC`
    );
    return rows;
  },

  /** Find a warehouse by PK. */
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, name, code, address, is_active, created_at, updated_at
         FROM warehouses WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  /** Find a warehouse by its short code. */
  async findByCode(code) {
    const [rows] = await pool.query(
      `SELECT id, name, code, address, is_active, created_at, updated_at
         FROM warehouses WHERE code = ? LIMIT 1`,
      [code]
    );
    return rows[0] || null;
  },

  /**
   * Return stock summary for a given warehouse.
   * Joins products so the consumer gets name & SKU alongside quantities.
   */
  async stockSummary(warehouseId) {
    const [rows] = await pool.query(
      `SELECT p.id AS product_id, p.name, p.sku, p.uom,
              p.min_stock, p.reorder_qty,
              COALESCE(s.quantity, 0) AS quantity
         FROM products p
         LEFT JOIN stock s
           ON s.product_id = p.product_id AND s.warehouse_id = ?
        WHERE p.is_active = 1
        ORDER BY p.name ASC`,
      [warehouseId]
    );
    return rows;
  },

  // ── INSERT ─────────────────────────────────────────────────

  /**
   * Create a new warehouse.
   * @param {{ name, code, address? }} data
   */
  async create(data) {
    const { name, code, address = null } = data;
    const [result] = await pool.query(
      `INSERT INTO warehouses (name, code, address) VALUES (?, ?, ?)`,
      [name, code, address]
    );
    return result.insertId;
  },

  // ── UPDATE ─────────────────────────────────────────────────

  /**
   * Update warehouse details.
   * @param {number} id
   * @param {{ name?, code?, address?, is_active? }} data
   */
  async update(id, data) {
    const { name, code, address, is_active } = data;
    const [result] = await pool.query(
      `UPDATE warehouses
          SET name      = COALESCE(?, name),
              code      = COALESCE(?, code),
              address   = COALESCE(?, address),
              is_active = COALESCE(?, is_active)
        WHERE id = ?`,
      [name ?? null, code ?? null, address ?? null, is_active ?? null, id]
    );
    return result.affectedRows;
  },

  /** Soft-delete a warehouse. */
  async deactivate(id) {
    const [result] = await pool.query(
      `UPDATE warehouses SET is_active = 0 WHERE id = ?`,
      [id]
    );
    return result.affectedRows;
  },
};

module.exports = Warehouse;
