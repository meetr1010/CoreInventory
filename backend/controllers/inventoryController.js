// backend/controllers/inventoryController.js
// Stock Adjustments + Dashboard statistics.
// ─────────────────────────────────────────────────────────────

'use strict';

const pool             = require('../config/db');
const Stock            = require('../models/Stock');
const inventoryService = require('../services/inventoryService');
const { getLowStockAlerts } = require('../services/notificationService');

// ── GET /api/inventory/stock ───────────────────────────────────
// Global stock summary (all products × warehouses)
async function getGlobalStock(req, res, next) {
  try {
    const stock = await Stock.globalSummary();
    res.json({ data: stock, count: stock.length });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/inventory/stock/:productId/:warehouseId ──────────
// Single product/warehouse stock level
async function getStockLevel(req, res, next) {
  try {
    const { productId, warehouseId } = req.params;
    const row = await Stock.findOne(productId, warehouseId);
    if (!row) {
      // Row doesn't exist means quantity is 0
      return res.json({ data: { productId: +productId, warehouseId: +warehouseId, quantity: 0 } });
    }
    res.json({ data: row });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/inventory/adjust ─────────────────────────────────
/**
 * Stock Adjustment endpoint – used by physical/cycle-count forms.
 *
 * Body:
 * {
 *   productId:   number,
 *   warehouseId: number,
 *   physicalQty: number,   // what the user physically counted
 *   notes?:      string,
 * }
 *
 * Response includes: systemQty, physicalQty, delta, movementId
 */
async function adjustStock(req, res, next) {
  try {
    const { productId, warehouseId, physicalQty, notes } = req.body;

    if (productId === undefined || warehouseId === undefined || physicalQty === undefined) {
      return res.status(400).json({
        error: 'productId, warehouseId, and physicalQty are required.',
      });
    }
    if (Number(physicalQty) < 0) {
      return res.status(400).json({ error: 'physicalQty cannot be negative.' });
    }

    const result = await inventoryService.applyAdjustment({
      productId:   Number(productId),
      warehouseId: Number(warehouseId),
      physicalQty: Number(physicalQty),
      performedBy: req.user.id,
      notes,
    });

    const message = result.delta === 0
      ? 'No discrepancy found. Stock unchanged.'
      : `Stock adjusted by ${result.delta > 0 ? '+' : ''}${result.delta}.`;

    res.json({ message, data: result });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/inventory/dashboard ──────────────────────────────
/**
 * Returns aggregated stats for the Dashboard UI:
 *  - total products
 *  - total warehouses
 *  - total on-hand value (qty × unit_cost)
 *  - low-stock alert count + list
 *  - top-5 products by total stock
 *  - recent movements (last 10)
 */
async function getDashboard(req, res, next) {
  try {
    const [
      [[{ totalProducts }]],
      [[{ totalWarehouses }]],
      [[{ totalOnHandValue }]],
      lowStockAlerts,
      [topProducts],
      [recentMovements],
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS totalProducts  FROM products  WHERE is_active = 1`),
      pool.query(`SELECT COUNT(*) AS totalWarehouses FROM warehouses WHERE is_active = 1`),
      pool.query(
        `SELECT COALESCE(SUM(s.quantity * p.unit_cost), 0) AS totalOnHandValue
           FROM stock s
           JOIN products p ON p.id = s.product_id
          WHERE p.is_active = 1 AND p.unit_cost IS NOT NULL`
      ),
      getLowStockAlerts(),
      pool.query(
        `SELECT p.id, p.name, p.sku, p.uom,
                COALESCE(SUM(s.quantity), 0) AS total_stock
           FROM products p
           LEFT JOIN stock s ON s.product_id = p.id
          WHERE p.is_active = 1
          GROUP BY p.id
          ORDER BY total_stock DESC
          LIMIT 5`
      ),
      pool.query(
        `SELECT sm.id, sm.movement_type, sm.quantity, sm.moved_at,
                p.name AS product_name, p.sku,
                w.name AS warehouse_name,
                u.name AS performed_by_name
           FROM stock_movements sm
           JOIN products   p ON p.id = sm.product_id
           JOIN warehouses w ON w.id = sm.warehouse_id
           JOIN users      u ON u.id = sm.performed_by
          ORDER BY sm.moved_at DESC
          LIMIT 10`
      ),
    ]);

    res.json({
      data: {
        totalProducts:    Number(totalProducts),
        totalWarehouses:  Number(totalWarehouses),
        totalOnHandValue: Number(totalOnHandValue),
        lowStockAlerts: {
          count: lowStockAlerts.length,
          items: lowStockAlerts,
        },
        topProducts,
        recentMovements,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getGlobalStock,
  getStockLevel,
  adjustStock,
  getDashboard,
};
