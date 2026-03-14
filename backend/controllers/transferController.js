// backend/controllers/transferController.js
// Handles Receipts, Deliveries, and Transfers.
// All state-changing operations are delegated to inventoryService
// which wraps everything in a BEGIN/COMMIT transaction.
// ─────────────────────────────────────────────────────────────

'use strict';

const pool             = require('../config/db');
const inventoryService = require('../services/inventoryService');

// ══════════════════════════════════════════════════════════════
//  RECEIPTS
// ══════════════════════════════════════════════════════════════

// GET /api/receipts
async function getAllReceipts(req, res, next) {
  try {
    const { warehouseId, status, limit = 50, offset = 0 } = req.query;
    const conditions = [];
    const params     = [];
    if (warehouseId) { conditions.push('r.warehouse_id = ?'); params.push(warehouseId); }
    if (status)      { conditions.push('r.status = ?');       params.push(status); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT r.id, r.reference, r.status, r.notes, r.received_at, r.created_at,
              w.name AS warehouse_name, w.code AS warehouse_code,
              u.name AS received_by_name
         FROM receipts r
         JOIN warehouses w ON w.id = r.warehouse_id
         JOIN users      u ON u.id = r.received_by
         ${where}
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

// GET /api/receipts/:id
async function getReceiptById(req, res, next) {
  try {
    const [[receipt]] = await pool.query(
      `SELECT r.*, w.name AS warehouse_name, u.name AS received_by_name
         FROM receipts r
         JOIN warehouses w ON w.id = r.warehouse_id
         JOIN users      u ON u.id = r.received_by
        WHERE r.id = ?`,
      [req.params.id]
    );
    if (!receipt) return res.status(404).json({ error: 'Receipt not found.' });
    res.json({ data: receipt });
  } catch (err) {
    next(err);
  }
}

// POST /api/receipts  – create a draft receipt header
async function createReceipt(req, res, next) {
  try {
    const { reference, warehouseId, notes } = req.body;
    if (!reference || !warehouseId) {
      return res.status(400).json({ error: 'reference and warehouseId are required.' });
    }
    const [result] = await pool.query(
      `INSERT INTO receipts (reference, warehouse_id, received_by, notes)
       VALUES (?, ?, ?, ?)`,
      [reference, warehouseId, req.user.id, notes || null]
    );
    res.status(201).json({ message: 'Receipt draft created.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Reference number already exists.' });
    }
    next(err);
  }
}

// POST /api/receipts/:id/validate  ← "Validate" button
// Body: { lines: [{ productId, quantity, notes? }] }
async function validateReceipt(req, res, next) {
  try {
    const receiptId = Number(req.params.id);
    const { lines } = req.body;

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'lines[] must be a non-empty array.' });
    }

    // Resolve the warehouse from the header
    const [[header]] = await pool.query(
      `SELECT warehouse_id FROM receipts WHERE id = ?`,
      [receiptId]
    );
    if (!header) return res.status(404).json({ error: 'Receipt not found.' });

    const result = await inventoryService.confirmReceipt({
      receiptId,
      warehouseId: header.warehouse_id,
      lines,
      performedBy: req.user.id,
    });

    res.json({ message: 'Receipt validated and stock updated.', data: result });
  } catch (err) {
    // 409 = insufficient stock / already confirmed
    next(err);
  }
}

// ══════════════════════════════════════════════════════════════
//  DELIVERIES
// ══════════════════════════════════════════════════════════════

// GET /api/deliveries
async function getAllDeliveries(req, res, next) {
  try {
    const { warehouseId, status, limit = 50, offset = 0 } = req.query;
    const conditions = [];
    const params     = [];
    if (warehouseId) { conditions.push('d.warehouse_id = ?'); params.push(warehouseId); }
    if (status)      { conditions.push('d.status = ?');       params.push(status); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT d.id, d.reference, d.status, d.destination, d.notes,
              d.dispatched_at, d.created_at,
              w.name AS warehouse_name, w.code AS warehouse_code,
              u.name AS dispatched_by_name
         FROM deliveries d
         JOIN warehouses w ON w.id = d.warehouse_id
         JOIN users      u ON u.id = d.dispatched_by
         ${where}
         ORDER BY d.created_at DESC
         LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

// GET /api/deliveries/:id
async function getDeliveryById(req, res, next) {
  try {
    const [[delivery]] = await pool.query(
      `SELECT d.*, w.name AS warehouse_name, u.name AS dispatched_by_name
         FROM deliveries d
         JOIN warehouses w ON w.id = d.warehouse_id
         JOIN users      u ON u.id = d.dispatched_by
        WHERE d.id = ?`,
      [req.params.id]
    );
    if (!delivery) return res.status(404).json({ error: 'Delivery not found.' });
    res.json({ data: delivery });
  } catch (err) {
    next(err);
  }
}

// POST /api/deliveries
async function createDelivery(req, res, next) {
  try {
    const { reference, warehouseId, destination, notes } = req.body;
    if (!reference || !warehouseId) {
      return res.status(400).json({ error: 'reference and warehouseId are required.' });
    }
    const [result] = await pool.query(
      `INSERT INTO deliveries (reference, warehouse_id, dispatched_by, destination, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [reference, warehouseId, req.user.id, destination || null, notes || null]
    );
    res.status(201).json({ message: 'Delivery draft created.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Reference number already exists.' });
    }
    next(err);
  }
}

// POST /api/deliveries/:id/validate  ← "Validate" button
async function validateDelivery(req, res, next) {
  try {
    const deliveryId = Number(req.params.id);
    const { lines }  = req.body;

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'lines[] must be a non-empty array.' });
    }

    const [[header]] = await pool.query(
      `SELECT warehouse_id FROM deliveries WHERE id = ?`,
      [deliveryId]
    );
    if (!header) return res.status(404).json({ error: 'Delivery not found.' });

    const result = await inventoryService.confirmDelivery({
      deliveryId,
      warehouseId: header.warehouse_id,
      lines,
      performedBy: req.user.id,
    });

    res.json({ message: 'Delivery validated and stock updated.', data: result });
  } catch (err) {
    next(err);
  }
}

// ══════════════════════════════════════════════════════════════
//  TRANSFERS
// ══════════════════════════════════════════════════════════════

// GET /api/transfers
async function getAllTransfers(req, res, next) {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const conditions = [];
    const params     = [];
    if (status) { conditions.push('t.status = ?'); params.push(status); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT t.id, t.reference, t.status, t.notes, t.transferred_at, t.created_at,
              wf.name AS from_warehouse_name, wt.name AS to_warehouse_name,
              u.name AS transferred_by_name
         FROM transfers t
         JOIN warehouses wf ON wf.id = t.from_warehouse_id
         JOIN warehouses wt ON wt.id = t.to_warehouse_id
         JOIN users      u  ON u.id  = t.transferred_by
         ${where}
         ORDER BY t.created_at DESC
         LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

// GET /api/transfers/:id
async function getTransferById(req, res, next) {
  try {
    const [[transfer]] = await pool.query(
      `SELECT t.*,
              wf.name AS from_warehouse_name, wt.name AS to_warehouse_name,
              u.name AS transferred_by_name
         FROM transfers t
         JOIN warehouses wf ON wf.id = t.from_warehouse_id
         JOIN warehouses wt ON wt.id = t.to_warehouse_id
         JOIN users      u  ON u.id  = t.transferred_by
        WHERE t.id = ?`,
      [req.params.id]
    );
    if (!transfer) return res.status(404).json({ error: 'Transfer not found.' });
    res.json({ data: transfer });
  } catch (err) {
    next(err);
  }
}

// POST /api/transfers
async function createTransfer(req, res, next) {
  try {
    const { reference, fromWarehouseId, toWarehouseId, notes } = req.body;
    if (!reference || !fromWarehouseId || !toWarehouseId) {
      return res.status(400).json({ error: 'reference, fromWarehouseId and toWarehouseId are required.' });
    }
    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({ error: 'Source and destination warehouses must differ.' });
    }
    const [result] = await pool.query(
      `INSERT INTO transfers (reference, from_warehouse_id, to_warehouse_id, transferred_by, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [reference, fromWarehouseId, toWarehouseId, req.user.id, notes || null]
    );
    res.status(201).json({ message: 'Transfer draft created.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Reference number already exists.' });
    }
    next(err);
  }
}

// POST /api/transfers/:id/validate  ← "Validate" button
async function validateTransfer(req, res, next) {
  try {
    const transferId = Number(req.params.id);
    const { lines }  = req.body;

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'lines[] must be a non-empty array.' });
    }

    const [[header]] = await pool.query(
      `SELECT from_warehouse_id, to_warehouse_id FROM transfers WHERE id = ?`,
      [transferId]
    );
    if (!header) return res.status(404).json({ error: 'Transfer not found.' });

    const result = await inventoryService.confirmTransfer({
      transferId,
      fromWarehouseId: header.from_warehouse_id,
      toWarehouseId:   header.to_warehouse_id,
      lines,
      performedBy: req.user.id,
    });

    res.json({ message: 'Transfer validated and stock updated.', data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  // Receipts
  getAllReceipts, getReceiptById, createReceipt, validateReceipt,
  // Deliveries
  getAllDeliveries, getDeliveryById, createDelivery, validateDelivery,
  // Transfers
  getAllTransfers, getTransferById, createTransfer, validateTransfer,
};
