// backend/models/StockMovement.js
// Append-only ledger of every stock change.
// NEVER update or delete rows in stock_movements.
// ─────────────────────────────────────────────────────────────

'use strict';

const pool = require('../config/db');

/**
 * Valid movement types mirror the `movement_type` ENUM in schema.sql
 */
const MOVEMENT_TYPES = Object.freeze({
  RECEIPT:      'receipt',
  DELIVERY:     'delivery',
  TRANSFER_OUT: 'transfer_out',
  TRANSFER_IN:  'transfer_in',
  ADJUSTMENT:   'adjustment',
});

const StockMovement = {
  MOVEMENT_TYPES,

  // ── INSERT ─────────────────────────────────────────────────

  /**
   * Append a single movement record to the ledger.
   * Quantity must always be positive; direction is conveyed by movement_type.
   *
   * @param {Object}  conn           - mysql2 connection (from pool.getConnection())
   * @param {{
   *   productId:      number,
   *   warehouseId:    number,
   *   movementType:   string,   // one of MOVEMENT_TYPES
   *   quantity:       number,   // positive value
   *   referenceId?:   number,
   *   referenceType?: string,
   *   performedBy:    number,
   *   notes?:         string,
   * }} data
   */
  async insert(conn, data) {
    const {
      productId,
      warehouseId,
      movementType,
      quantity,
      referenceId   = null,
      referenceType = null,
      performedBy,
      notes         = null,
    } = data;

    if (quantity <= 0) {
      throw Object.assign(
        new Error('StockMovement quantity must be a positive number.'),
        { status: 400 }
      );
    }

    const [result] = await conn.query(
      `INSERT INTO stock_movements
         (product_id, warehouse_id, movement_type, quantity,
          reference_id, reference_type, performed_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, warehouseId, movementType, quantity,
       referenceId, referenceType, performedBy, notes]
    );
    return result.insertId;
  },

  // ── SELECT ─────────────────────────────────────────────────

  /**
   * Fetch ledger entries with rich joins, newest first.
   * @param {{ productId?, warehouseId?, movementType?, limit?, offset? }} filters
   */
  async findAll({ productId, warehouseId, movementType, limit = 50, offset = 0 } = {}) {
    const conditions = [];
    const params     = [];

    if (productId) {
      conditions.push('sm.product_id = ?');
      params.push(productId);
    }
    if (warehouseId) {
      conditions.push('sm.warehouse_id = ?');
      params.push(warehouseId);
    }
    if (movementType) {
      conditions.push('sm.movement_type = ?');
      params.push(movementType);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT sm.id, sm.movement_type, sm.quantity,
              sm.reference_id, sm.reference_type, sm.notes, sm.moved_at,
              p.id   AS product_id,   p.name  AS product_name,  p.sku, p.uom,
              w.id   AS warehouse_id, w.name  AS warehouse_name, w.code AS warehouse_code,
              u.id   AS performed_by, u.name  AS performed_by_name
         FROM stock_movements sm
         JOIN products   p ON p.id = sm.product_id
         JOIN warehouses w ON w.id = sm.warehouse_id
         JOIN users      u ON u.id = sm.performed_by
         ${where}
        ORDER BY sm.moved_at DESC, sm.id DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    return rows;
  },

  /** Fetch a single movement record by PK. */
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT sm.id, sm.movement_type, sm.quantity,
              sm.reference_id, sm.reference_type, sm.notes, sm.moved_at,
              p.id   AS product_id,   p.name  AS product_name,  p.sku, p.uom,
              w.id   AS warehouse_id, w.name  AS warehouse_name, w.code AS warehouse_code,
              u.id   AS performed_by, u.name  AS performed_by_name
         FROM stock_movements sm
         JOIN products   p ON p.id = sm.product_id
         JOIN warehouses w ON w.id = sm.warehouse_id
         JOIN users      u ON u.id = sm.performed_by
        WHERE sm.id = ?
        LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Return all movements linked to a specific operation
   * (e.g. all lines for receipt #42).
   * @param {'receipt'|'delivery'|'transfer'|'adjustment'} refType
   * @param {number} refId
   */
  async findByReference(refType, refId) {
    const [rows] = await pool.query(
      `SELECT sm.id, sm.movement_type, sm.quantity, sm.notes, sm.moved_at,
              p.id AS product_id, p.name AS product_name, p.sku, p.uom,
              w.id AS warehouse_id, w.name AS warehouse_name
         FROM stock_movements sm
         JOIN products   p ON p.id = sm.product_id
         JOIN warehouses w ON w.id = sm.warehouse_id
        WHERE sm.reference_type = ? AND sm.reference_id = ?
        ORDER BY sm.id ASC`,
      [refType, refId]
    );
    return rows;
  },

  // ── REPORTING ──────────────────────────────────────────────

  /**
   * Total movements grouped by type for a product within an optional date range.
   * Useful for building product history charts.
   * @param {number} productId
   * @param {{ from?: string, to?: string }} dateRange  – ISO date strings (UTC)
   */
  async summaryByProduct(productId, { from, to } = {}) {
    const conditions = ['sm.product_id = ?'];
    const params     = [productId];

    if (from) { conditions.push('sm.moved_at >= ?'); params.push(from); }
    if (to)   { conditions.push('sm.moved_at <= ?'); params.push(to);   }

    const [rows] = await pool.query(
      `SELECT sm.movement_type,
              COUNT(*)          AS event_count,
              SUM(sm.quantity)  AS total_qty
         FROM stock_movements sm
        WHERE ${conditions.join(' AND ')}
        GROUP BY sm.movement_type`,
      params
    );
    return rows;
  },
};

module.exports = StockMovement;
