// backend/routes/transferRoutes.js
// Receipts, Deliveries, and Transfers — protected by role middleware.
'use strict';

const router             = require('express').Router();
const transferController = require('../controllers/transferController');
const protect            = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// ── Receipts ─────────────────────────────────────────────────
//  GET:   any authenticated user (Viewer can see)
//  POST:  Staff and above can create drafts
//  VALIDATE: Manager or Admin only
router.get  ('/receipts',              protect.any, transferController.getAllReceipts);
router.get  ('/receipts/:id',          protect.any, transferController.getReceiptById);
router.post ('/receipts',              protect.any, authorizeRoles('Admin','Manager','Staff'), transferController.createReceipt);
router.post ('/receipts/:id/validate', protect.any, authorizeRoles('Admin','Manager'),        transferController.validateReceipt);

// ── Deliveries ────────────────────────────────────────────────
router.get  ('/deliveries',              protect.any, transferController.getAllDeliveries);
router.get  ('/deliveries/:id',          protect.any, transferController.getDeliveryById);
router.post ('/deliveries',              protect.any, authorizeRoles('Admin','Manager','Staff'), transferController.createDelivery);
router.post ('/deliveries/:id/validate', protect.any, authorizeRoles('Admin','Manager'),        transferController.validateDelivery);

// ── Transfers ─────────────────────────────────────────────────
router.get  ('/transfers',              protect.any, transferController.getAllTransfers);
router.get  ('/transfers/:id',          protect.any, transferController.getTransferById);
router.post ('/transfers',              protect.any, authorizeRoles('Admin','Manager','Staff'), transferController.createTransfer);
router.post ('/transfers/:id/validate', protect.any, authorizeRoles('Admin','Manager'),        transferController.validateTransfer);

module.exports = router;
