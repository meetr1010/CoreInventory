// backend/controllers/productController.js
// CRUD for Products and Warehouses.
// ─────────────────────────────────────────────────────────────

'use strict';

const Product   = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Stock     = require('../models/Stock');

// ══════════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════════

// GET /api/products
async function getAllProducts(req, res, next) {
  try {
    const includeInactive = req.query.inactive === 'true';
    const products = await Product.findAll({ includeInactive });
    res.json({ data: products, count: products.length });
  } catch (err) {
    next(err);
  }
}

// GET /api/products/:id
async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    // Also attach stock per warehouse
    const stock = await Stock.findByProduct(product.id);
    res.json({ data: { ...product, stock } });
  } catch (err) {
    next(err);
  }
}

// GET /api/products/low-stock
async function getLowStockProducts(req, res, next) {
  try {
    const products = await Product.findBelowReorderPoint();
    res.json({ data: products, count: products.length });
  } catch (err) {
    next(err);
  }
}

// POST /api/products
async function createProduct(req, res, next) {
  try {
    const { name, sku, category, uom, description, min_stock, reorder_qty, unit_cost } = req.body;
    if (!name || !sku) {
      return res.status(400).json({ error: 'name and sku are required.' });
    }
    const existing = await Product.findBySku(sku);
    if (existing) {
      return res.status(409).json({ error: `SKU "${sku}" is already in use.` });
    }
    const id = await Product.create({ name, sku, category, uom, description, min_stock, reorder_qty, unit_cost });
    const product = await Product.findById(id);
    res.status(201).json({ message: 'Product created.', data: product });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/products/:id
async function updateProduct(req, res, next) {
  try {
    const affected = await Product.update(req.params.id, req.body);
    if (!affected) return res.status(404).json({ error: 'Product not found.' });
    const product = await Product.findById(req.params.id);
    res.json({ message: 'Product updated.', data: product });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/products/:id  (soft delete)
async function deactivateProduct(req, res, next) {
  try {
    const affected = await Product.deactivate(req.params.id);
    if (!affected) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product deactivated.' });
  } catch (err) {
    next(err);
  }
}

// ══════════════════════════════════════════════════════════════
//  WAREHOUSES
// ══════════════════════════════════════════════════════════════

// GET /api/warehouses
async function getAllWarehouses(req, res, next) {
  try {
    const includeInactive = req.query.inactive === 'true';
    const warehouses = await Warehouse.findAll({ includeInactive });
    res.json({ data: warehouses, count: warehouses.length });
  } catch (err) {
    next(err);
  }
}

// GET /api/warehouses/:id
async function getWarehouseById(req, res, next) {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) return res.status(404).json({ error: 'Warehouse not found.' });
    const stock = await Stock.findByWarehouse(warehouse.id);
    res.json({ data: { ...warehouse, stock } });
  } catch (err) {
    next(err);
  }
}

// POST /api/warehouses
async function createWarehouse(req, res, next) {
  try {
    const { name, code, address } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'name and code are required.' });
    }
    const existing = await Warehouse.findByCode(code);
    if (existing) {
      return res.status(409).json({ error: `Code "${code}" is already in use.` });
    }
    const id        = await Warehouse.create({ name, code, address });
    const warehouse = await Warehouse.findById(id);
    res.status(201).json({ message: 'Warehouse created.', data: warehouse });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/warehouses/:id
async function updateWarehouse(req, res, next) {
  try {
    const affected = await Warehouse.update(req.params.id, req.body);
    if (!affected) return res.status(404).json({ error: 'Warehouse not found.' });
    const warehouse = await Warehouse.findById(req.params.id);
    res.json({ message: 'Warehouse updated.', data: warehouse });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/warehouses/:id  (soft delete)
async function deactivateWarehouse(req, res, next) {
  try {
    const affected = await Warehouse.deactivate(req.params.id);
    if (!affected) return res.status(404).json({ error: 'Warehouse not found.' });
    res.json({ message: 'Warehouse deactivated.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  // Products
  getAllProducts,
  getProductById,
  getLowStockProducts,
  createProduct,
  updateProduct,
  deactivateProduct,
  // Warehouses
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deactivateWarehouse,
};
