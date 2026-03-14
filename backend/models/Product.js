// backend/models/Product.js
// Raw SQL queries for Products (including Reordering Rules)
// ─────────────────────────────────────────────────────────────

'use strict';

const pool = require('../config/db');

const Product = {
  // ── SELECT ─────────────────────────────────────────────────

  /** Return all active products. */
  async findAll({ includeInactive = false } = {}) {
    const whereClause = includeInactive ? '' : 'WHERE is_active = 1';
    const [rows] = await pool.query(
      `SELECT id, name, sku, category, uom, description,
              min_stock, reorder_qty, unit_cost, is_active,
              created_at, updated_at
         FROM products
         ${whereClause}
        ORDER BY name ASC`
    );
    return rows;
  },

  /** Find a product by PK. */
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, name, sku, category, uom, description,
              min_stock, reorder_qty, unit_cost, is_active,
              created_at, updated_at
         FROM products WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  /** Find a product by SKU. */
  async findBySku(sku) {
    const [rows] = await pool.query(
      `SELECT id, name, sku, category, uom, description,
              min_stock, reorder_qty, unit_cost, is_active,
              created_at, updated_at
         FROM products WHERE sku = ? LIMIT 1`,
      [sku]
    );
    return rows[0] || null;
  },

  /** Products whose current stock (any warehouse) is below min_stock. */
  async findBelowReorderPoint() {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.sku, p.category, p.uom,
              p.min_stock, p.reorder_qty,
              COALESCE(SUM(s.quantity), 0) AS total_stock
         FROM products p
         LEFT JOIN stock s ON s.product_id = p.id
        WHERE p.is_active = 1
        GROUP BY p.id
       HAVING total_stock < p.min_stock
        ORDER BY p.name ASC`
    );
    return rows;
  },

  // ── INSERT ─────────────────────────────────────────────────

  /**
   * Create a new product.
   * @param {{ name, sku, category?, uom?, description?, min_stock?, reorder_qty?, unit_cost? }} data
   */
  async create(data) {
    const {
      name,
      sku,
      category    = null,
      uom         = 'pcs',
      description = null,
      min_stock   = 0,
      reorder_qty = 0,
      unit_cost   = null,
    } = data;
    const [result] = await pool.query(
      `INSERT INTO products
         (name, sku, category, uom, description, min_stock, reorder_qty, unit_cost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, sku, category, uom, description, min_stock, reorder_qty, unit_cost]
    );
    return result.insertId;
  },

  // ── UPDATE ─────────────────────────────────────────────────

  /**
   * Update product details including reorder rule.
   * @param {number} id
   * @param {{ name?, sku?, category?, uom?, description?, min_stock?, reorder_qty?, unit_cost?, is_active? }} data
   */
  async update(id, data) {
    const {
      name, sku, category, uom, description,
      min_stock, reorder_qty, unit_cost, is_active,
    } = data;
    const [result] = await pool.query(
      `UPDATE products
          SET name        = COALESCE(?, name),
              sku         = COALESCE(?, sku),
              category    = COALESCE(?, category),
              uom         = COALESCE(?, uom),
              description = COALESCE(?, description),
              min_stock   = COALESCE(?, min_stock),
              reorder_qty = COALESCE(?, reorder_qty),
              unit_cost   = COALESCE(?, unit_cost),
              is_active   = COALESCE(?, is_active)
        WHERE id = ?`,
      [
        name    ?? null, sku      ?? null, category ?? null,
        uom     ?? null, description ?? null,
        min_stock   !== undefined ? min_stock   : null,
        reorder_qty !== undefined ? reorder_qty : null,
        unit_cost   !== undefined ? unit_cost   : null,
        is_active   !== undefined ? is_active   : null,
        id,
      ]
    );
    return result.affectedRows;
  },

  /** Soft-delete a product. */
  async deactivate(id) {
    const [result] = await pool.query(
      `UPDATE products SET is_active = 0 WHERE id = ?`,
      [id]
    );
    return result.affectedRows;
  },
};

module.exports = Product;
