// backend/routes/historyRoutes.js
'use strict';

const router            = require('express').Router();
const historyController = require('../controllers/historyController');
const protect           = require('../middleware/authMiddleware');

// GET /api/history                          – paginated ledger
router.get('/',                              protect.any, historyController.listHistory);

// GET /api/history/:id                      – single movement
router.get('/:id(\\d+)',                     protect.any, historyController.getMovementById);

// GET /api/history/reference/:type/:id      – all lines for an operation
router.get('/reference/:type/:id',           protect.any, historyController.getMovementsByReference);

// GET /api/history/summary/:productId       – chart aggregation per product
router.get('/summary/:productId',            protect.any, historyController.getProductSummary);

module.exports = router;
