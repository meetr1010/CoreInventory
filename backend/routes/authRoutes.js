// backend/routes/authRoutes.js
'use strict';

const router         = require('express').Router();
const authController = require('../controllers/authController');
const protect        = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// ── Public ────────────────────────────────────────────────────
// Password-based login (returns JWT)
router.post('/login',               authController.login);

// OTP-based login (two-step)
router.post('/request-otp',         authController.requestOtp);
router.post('/verify-otp',          authController.verifyOtp);

// Registration (two-step: register → verify OTP to activate)
router.post('/register',            authController.register);
router.post('/register/verify-otp', authController.verifyRegisterOtp);

// ── Protected ─────────────────────────────────────────────────
router.get('/me', protect.any, authController.me);

// Admin-only: list all users
router.get('/users', protect.any, authorizeRoles('Admin'), authController.listUsers);

module.exports = router;
