// backend/services/inventoryService.js
// Transactional orchestration for all stock-moving operations.
// Controllers call these service functions; models never touch transactions directly.
// ─────────────────────────────────────────────────────────────

'use strict';

const pool          = require('../config/db');
const Stock         = require('../models/Stock');
const StockMovement = require('../models/StockMovement');
const { notifyLowStock } = require('./notificationService');

const { MOVEMENT_TYPES: MT } = StockMovement;

// ── Helper ────────────────────────────────────────────────────
/**
 * Wrap an async callback inside a single MySQL transaction.
 * Automatically rolls back on any error and re-throws.
 */
async function withTransaction(callback) {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ── Receipt ───────────────────────────────────────────────────
/**
 * Confirm a receipt: increase stock and record movement for each line item.
 *
 * @param {{
 *   receiptId:   number,
 *   warehouseId: number,
 *   lines: Array<{ productId: number, quantity: number, notes?: string }>,
 *   performedBy: number,
 * }} params
 */
async function confirmReceipt({ receiptId, warehouseId, lines, performedBy }) {
  return withTransaction(async (conn) => {
    // Mark the receipt header as confirmed
    await conn.query(
      `UPDATE receipts
          SET status = 'confirmed', received_at = NOW()
        WHERE id = ? AND status = 'draft'`,
      [receiptId]
    );
    // Verify the update actually matched
    const [[header]] = await conn.query(
      `SELECT id FROM receipts WHERE id = ? AND status = 'confirmed'`,
      [receiptId]
    );
    if (!header) {
      throw Object.assign(
        new Error(`Receipt #${receiptId} is not in draft status or does not exist.`),
        { status: 409 }
      );
    }

    const movementIds = [];
    for (const line of lines) {
      const { productId, quantity, notes = null } = line;
      if (!productId || quantity <= 0) {
        throw Object.assign(
          new Error(`Invalid line: productId=${productId} quantity=${quantity}`),
          { status: 400 }
        );
      }
      // Increase stock
      await Stock.adjust(conn, productId, warehouseId, +quantity);
      // Append to ledger
      const movId = await StockMovement.insert(conn, {
        productId, warehouseId,
        movementType:  MT.RECEIPT,
        quantity,
        referenceId:   receiptId,
        referenceType: 'receipt',
        performedBy,
        notes,
      });
      movementIds.push(movId);
    }
    return { receiptId, movementIds };
  }).then(async (res) => {
    // Post-transaction: fire low-stock notifications (non-blocking)
    await notifyLowStock(lines.map((l) => l.productId)).catch(console.error);
    return res;
  });
}

// ── Delivery ──────────────────────────────────────────────────
/**
 * Confirm a delivery: decrease stock (with negative-stock guard) and record movements.
 *
 * @param {{
 *   deliveryId:  number,
 *   warehouseId: number,
 *   lines: Array<{ productId: number, quantity: number, notes?: string }>,
 *   performedBy: number,
 * }} params
 */
async function confirmDelivery({ deliveryId, warehouseId, lines, performedBy }) {
  return withTransaction(async (conn) => {
    await conn.query(
      `UPDATE deliveries
          SET status = 'confirmed', dispatched_at = NOW()
        WHERE id = ? AND status = 'draft'`,
      [deliveryId]
    );
    const [[header]] = await conn.query(
      `SELECT id FROM deliveries WHERE id = ? AND status = 'confirmed'`,
      [deliveryId]
    );
    if (!header) {
      throw Object.assign(
        new Error(`Delivery #${deliveryId} is not in draft status or does not exist.`),
        { status: 409 }
      );
    }

    const movementIds = [];
    for (const line of lines) {
      const { productId, quantity, notes = null } = line;
      if (!productId || quantity <= 0) {
        throw Object.assign(
          new Error(`Invalid line: productId=${productId} quantity=${quantity}`),
          { status: 400 }
        );
      }
      // Decrease stock – Stock.adjust throws 409 on insufficient stock
      await Stock.adjust(conn, productId, warehouseId, -quantity);
      // Append to ledger
      const movId = await StockMovement.insert(conn, {
        productId, warehouseId,
        movementType:  MT.DELIVERY,
        quantity,
        referenceId:   deliveryId,
        referenceType: 'delivery',
        performedBy,
        notes,
      });
      movementIds.push(movId);
    }
    return { deliveryId, movementIds };
  }).then(async (res) => {
    await notifyLowStock(lines.map((l) => l.productId)).catch(console.error);
    return res;
  });
}

// ── Transfer ──────────────────────────────────────────────────
/**
 * Confirm an internal transfer between two warehouses.
 * Decreases source stock then increases destination stock in one transaction.
 *
 * @param {{
 *   transferId:      number,
 *   fromWarehouseId: number,
 *   toWarehouseId:   number,
 *   lines: Array<{ productId: number, quantity: number, notes?: string }>,
 *   performedBy: number,
 * }} params
 */
async function confirmTransfer({
  transferId,
  fromWarehouseId,
  toWarehouseId,
  lines,
  performedBy,
}) {
  if (fromWarehouseId === toWarehouseId) {
    throw Object.assign(
      new Error('Source and destination warehouses must differ.'),
      { status: 400 }
    );
  }

  return withTransaction(async (conn) => {
    await conn.query(
      `UPDATE transfers
          SET status = 'confirmed', transferred_at = NOW()
        WHERE id = ? AND status = 'draft'`,
      [transferId]
    );
    const [[header]] = await conn.query(
      `SELECT id FROM transfers WHERE id = ? AND status = 'confirmed'`,
      [transferId]
    );
    if (!header) {
      throw Object.assign(
        new Error(`Transfer #${transferId} is not in draft status or does not exist.`),
        { status: 409 }
      );
    }

    const movementIds = [];
    for (const line of lines) {
      const { productId, quantity, notes = null } = line;
      if (!productId || quantity <= 0) {
        throw Object.assign(
          new Error(`Invalid line: productId=${productId} quantity=${quantity}`),
          { status: 400 }
        );
      }
      // Decrease source (throws 409 on insufficient stock)
      await Stock.adjust(conn, productId, fromWarehouseId, -quantity);
      // Increase destination
      await Stock.adjust(conn, productId, toWarehouseId, +quantity);

      // Two ledger entries per line
      const outId = await StockMovement.insert(conn, {
        productId,
        warehouseId:   fromWarehouseId,
        movementType:  MT.TRANSFER_OUT,
        quantity,
        referenceId:   transferId,
        referenceType: 'transfer',
        performedBy,
        notes,
      });
      const inId = await StockMovement.insert(conn, {
        productId,
        warehouseId:   toWarehouseId,
        movementType:  MT.TRANSFER_IN,
        quantity,
        referenceId:   transferId,
        referenceType: 'transfer',
        performedBy,
        notes,
      });
      movementIds.push(outId, inId);
    }
    return { transferId, movementIds };
  }).then(async (res) => {
    await notifyLowStock(lines.map((l) => l.productId)).catch(console.error);
    return res;
  });
}

// ── Adjustment ────────────────────────────────────────────────
/**
 * Perform a stock adjustment (cycle count / physical inventory correction).
 * Sets the absolute quantity and records the delta as an adjustment movement.
 *
 * @param {{
 *   productId:      number,
 *   warehouseId:    number,
 *   physicalQty:    number,   – actual counted quantity
 *   performedBy:    number,
 *   notes?:         string,
 * }} params
 * @returns {{ delta: number, movementId: number|null }}
 */
async function applyAdjustment({
  productId,
  warehouseId,
  physicalQty,
  performedBy,
  notes = null,
}) {
  if (physicalQty < 0) {
    throw Object.assign(
      new Error('Physical quantity cannot be negative.'),
      { status: 400 }
    );
  }

  return withTransaction(async (conn) => {
    // Lock and read current quantity
    const [rows] = await conn.query(
      `SELECT COALESCE(quantity, 0) AS quantity
         FROM stock
        WHERE product_id = ? AND warehouse_id = ?
        FOR UPDATE`,
      [productId, warehouseId]
    );
    const systemQty = Number(rows[0]?.quantity ?? 0);
    const delta     = physicalQty - systemQty;

    // Always write the absolute value
    await Stock.setAbsolute(conn, productId, warehouseId, physicalQty);

    // Only record a movement when there is an actual discrepancy
    let movementId = null;
    if (delta !== 0) {
      movementId = await StockMovement.insert(conn, {
        productId,
        warehouseId,
        movementType:  MT.ADJUSTMENT,
        quantity:      Math.abs(delta),
        referenceId:   null,
        referenceType: 'adjustment',
        performedBy,
        notes: notes || `System qty: ${systemQty}, physical count: ${physicalQty}`,
      });
    }

    return { systemQty, physicalQty, delta, movementId };
  }).then(async (res) => {
    await notifyLowStock([productId]).catch(console.error);
    return res;
  });
}

module.exports = {
  confirmReceipt,
  confirmDelivery,
  confirmTransfer,
  applyAdjustment,
};
