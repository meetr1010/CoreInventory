// backend/routes/productRoutes.js
'use strict';

const router            = require('express').Router();
const productController = require('../controllers/productController');
const protect           = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// ── Products ─────────────────────────────────────────────────
//  GET:    all roles can read
//  POST/PATCH:  Manager or Admin can modify
//  DELETE: Admin only (soft delete)
router.get   ('/',          protect.any, productController.getAllProducts);
router.get   ('/low-stock', protect.any, productController.getLowStockProducts);
router.get   ('/:id',       protect.any, productController.getProductById);
router.post  ('/',          protect.any, authorizeRoles('Admin','Manager'), productController.createProduct);
router.patch ('/:id',       protect.any, authorizeRoles('Admin','Manager'), productController.updateProduct);
router.delete('/:id',       protect.any, authorizeRoles('Admin'),           productController.deactivateProduct);

module.exports = router;
