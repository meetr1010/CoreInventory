// backend/middleware/authMiddleware.js
// Verifies JWT issued by the OTP login flow and attaches req.user.
// ─────────────────────────────────────────────────────────────
// Expected header:  Authorization: Bearer <jwt>
// ─────────────────────────────────────────────────────────────

'use strict';

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_env';

/**
 * Middleware factory.
 * @param {'admin'|'manager'|'staff'} [minRole]  – optional minimum role gate
 */
const protect = (minRole) => async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided.' });
    }
    const token = authHeader.slice(7);

    // 2. Verify signature & expiry
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      const msg = jwtErr.name === 'TokenExpiredError'
        ? 'Token has expired.'
        : 'Invalid token.';
      return res.status(401).json({ error: msg });
    }

    // 3. Load fresh user from DB (catches deactivated accounts)
    const user = await User.findById(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Account not found or disabled.' });
    }

    // 4. Role gate (optional)
    if (minRole) {
      const ROLE_RANK = { staff: 0, manager: 1, admin: 2 };
      if ((ROLE_RANK[user.role] ?? -1) < (ROLE_RANK[minRole] ?? 99)) {
        return res.status(403).json({ error: 'Insufficient permissions.' });
      }
    }

    // 5. Attach user so downstream controllers can reference req.user
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/** Convenience aliases */
protect.any     = protect();              // any authenticated user
protect.staff   = protect();              // alias – same as any (staff+)
protect.manager = protect('manager');     // manager or above
protect.admin   = protect('admin');       // admin only

module.exports = protect;
