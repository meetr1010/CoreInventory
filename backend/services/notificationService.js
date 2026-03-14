// backend/services/notificationService.js
// Flags products that have fallen below their reorder threshold.
// Currently writes structured alerts to the console and returns them.
// In Phase 3, swap the console.warn lines for email/WS pushes.
// ─────────────────────────────────────────────────────────────

'use strict';

const pool = require('../config/db');

/**
 * Check one or more products against their min_stock rule.
 * Called after every confirmed operation (non-blocking – failures are swallowed).
 *
 * @param {number[]} productIds
 * @returns {Promise<Array>}  List of low-stock alert objects
 */
async function notifyLowStock(productIds) {
  if (!productIds?.length) return [];

  // Remove duplicates
  const uniqueIds = [...new Set(productIds.filter(Boolean))];

  const placeholders = uniqueIds.map(() => '?').join(', ');

  const [rows] = await pool.query(
    `SELECT
       p.id              AS product_id,
       p.name            AS product_name,
       p.sku,
       p.uom,
       p.min_stock,
       p.reorder_qty,
       COALESCE(SUM(s.quantity), 0) AS total_stock
     FROM products p
     LEFT JOIN stock s ON s.product_id = p.id
     WHERE p.id IN (${placeholders})
       AND p.is_active = 1
     GROUP BY p.id
     HAVING total_stock < p.min_stock`,
    uniqueIds
  );

  if (rows.length > 0) {
    const alerts = rows.map((r) => ({
      productId:   r.product_id,
      productName: r.product_name,
      sku:         r.sku,
      uom:         r.uom,
      totalStock:  Number(r.total_stock),
      minStock:    Number(r.min_stock),
      reorderQty:  Number(r.reorder_qty),
      shortfall:   Number(r.min_stock) - Number(r.total_stock),
    }));

    alerts.forEach((a) => {
      console.warn(
        `[LOW STOCK] ${a.productName} (${a.sku}): ` +
        `stock=${a.totalStock} ${a.uom}, min=${a.minStock}, ` +
        `reorder ${a.reorderQty} ${a.uom}`
      );
    });

    // TODO Phase 3: emit via WebSocket / send email
    // io.emit('low_stock_alert', alerts);

    return alerts;
  }

  return [];
}

/**
 * Return all currently below-threshold products.
 * Used by the Dashboard stats endpoint.
 */
async function getLowStockAlerts() {
  const [rows] = await pool.query(
    `SELECT
       p.id              AS product_id,
       p.name            AS product_name,
       p.sku,
       p.uom,
       p.min_stock,
       p.reorder_qty,
       COALESCE(SUM(s.quantity), 0) AS total_stock
     FROM products p
     LEFT JOIN stock s ON s.product_id = p.id
     WHERE p.is_active = 1
     GROUP BY p.id
     HAVING total_stock < p.min_stock
     ORDER BY (p.min_stock - COALESCE(SUM(s.quantity), 0)) DESC`
  );

  return rows.map((r) => ({
    productId:   r.product_id,
    productName: r.product_name,
    sku:         r.sku,
    uom:         r.uom,
    totalStock:  Number(r.total_stock),
    minStock:    Number(r.min_stock),
    reorderQty:  Number(r.reorder_qty),
    shortfall:   Number(r.min_stock) - Number(r.total_stock),
  }));
}

module.exports = { notifyLowStock, getLowStockAlerts };
