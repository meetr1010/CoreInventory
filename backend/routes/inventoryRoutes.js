// backend/routes/inventoryRoutes.js
'use strict';

const router              = require('express').Router();
const inventoryController = require('../controllers/inventoryController');
const productController   = require('../controllers/productController');
const protect             = require('../middleware/authMiddleware');
const { authorizeRoles }  = require('../middleware/roleMiddleware');

// ── Stock views (all roles) ───────────────────────────────────
router.get('/stock',                         protect.any, inventoryController.getGlobalStock);
router.get('/stock/:productId/:warehouseId', protect.any, inventoryController.getStockLevel);
router.get('/dashboard',                     protect.any, inventoryController.getDashboard);

// ── Stock adjustment (Manager / Admin only) ───────────────────
router.post('/adjust', protect.any, authorizeRoles('Admin','Manager'), inventoryController.adjustStock);

// ── Warehouses ────────────────────────────────────────────────
router.get   ('/warehouses',     protect.any, productController.getAllWarehouses);
router.get   ('/warehouses/:id', protect.any, productController.getWarehouseById);
router.post  ('/warehouses',     protect.any, authorizeRoles('Admin'),           productController.createWarehouse);
router.patch ('/warehouses/:id', protect.any, authorizeRoles('Admin','Manager'), productController.updateWarehouse);
router.delete('/warehouses/:id', protect.any, authorizeRoles('Admin'),           productController.deactivateWarehouse);

module.exports = router;
