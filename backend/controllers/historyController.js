// backend/controllers/historyController.js
// Paginated, filterable access to the StockMovements ledger.
// ─────────────────────────────────────────────────────────────

'use strict';

const pool         = require('../config/db');
const StockMovement = require('../models/StockMovement');

// ── GET /api/history ──────────────────────────────────────────
/**
 * List movements with full filter support.
 *
 * Query params:
 *  productId     – filter by product
 *  warehouseId   – filter by warehouse
 *  movementType  – receipt | delivery | transfer_out | transfer_in | adjustment
 *  from          – ISO date string (start)
 *  to            – ISO date string (end)
 *  page          – page number (1-indexed, default 1)
 *  limit         – rows per page (default 25, max 100)
 */
async function listHistory(req, res, next) {
  try {
    const {
      productId,
      warehouseId,
      movementType,
      from,
      to,
      page  = 1,
      limit = 25,
    } = req.query;

    const pageNum  = Math.max(1, Number(page));
    const pageSize = Math.min(100, Math.max(1, Number(limit)));
    const offset   = (pageNum - 1) * pageSize;

    const conditions = [];
    const countParams = [];

    if (productId)    { conditions.push('sm.product_id = ?');    countParams.push(productId); }
    if (warehouseId)  { conditions.push('sm.warehouse_id = ?');  countParams.push(warehouseId); }
    if (movementType) { conditions.push('sm.movement_type = ?'); countParams.push(movementType); }
    if (from)         { conditions.push('sm.moved_at >= ?');     countParams.push(from); }
    if (to)           { conditions.push('sm.moved_at <= ?');     countParams.push(to); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Run total-count and data queries in parallel
    const [[countRows], [dataRows]] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total
           FROM stock_movements sm
           ${where}`,
        countParams
      ),
      pool.query(
        `SELECT sm.id, sm.movement_type, sm.quantity,
                sm.reference_id, sm.reference_type, sm.notes, sm.moved_at,
                p.id   AS product_id,   p.name  AS product_name,  p.sku, p.uom, p.category,
                w.id   AS warehouse_id, w.name  AS warehouse_name, w.code AS warehouse_code,
                u.id   AS performed_by, u.name  AS performed_by_name
           FROM stock_movements sm
           JOIN products   p ON p.id = sm.product_id
           JOIN warehouses w ON w.id = sm.warehouse_id
           JOIN users      u ON u.id = sm.performed_by
           ${where}
          ORDER BY sm.moved_at DESC, sm.id DESC
          LIMIT ? OFFSET ?`,
        [...countParams, pageSize, offset]
      ),
    ]);

    const total     = Number(countRows[0].total);
    const totalPages = Math.ceil(total / pageSize);

    res.json({
      data: dataRows,
      pagination: {
        total,
        totalPages,
        page:     pageNum,
        limit:    pageSize,
        offset,
        hasPrev:  pageNum > 1,
        hasNext:  pageNum < totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/history/:id ──────────────────────────────────────
async function getMovementById(req, res, next) {
  try {
    const movement = await StockMovement.findById(req.params.id);
    if (!movement) return res.status(404).json({ error: 'Movement record not found.' });
    res.json({ data: movement });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/history/reference/:type/:id ──────────────────────
// All movements for a specific operation (e.g. receipt #5)
async function getMovementsByReference(req, res, next) {
  try {
    const { type, id } = req.params;
    const movements = await StockMovement.findByReference(type, id);
    res.json({ data: movements, count: movements.length });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/history/summary/:productId ──────────────────────
// Aggregated movement totals per type for a product (chart data)
async function getProductSummary(req, res, next) {
  try {
    const { productId } = req.params;
    const { from, to }  = req.query;
    const summary = await StockMovement.summaryByProduct(productId, { from, to });
    res.json({ data: summary });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listHistory,
  getMovementById,
  getMovementsByReference,
  getProductSummary,
};
