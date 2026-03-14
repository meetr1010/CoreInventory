// backend/middleware/roleMiddleware.js
// Factory: restrict routes to one or more allowed roles.
// Usage:  router.post('/admin-only', protect.any, authorizeRoles('Admin'), handler)
//         router.post('/ops',        protect.any, authorizeRoles('Admin','Manager','Staff'), handler)
// ─────────────────────────────────────────────────────────────

'use strict';

/**
 * Role hierarchy map – higher number = more privileges.
 * Used for "minimum role" checks e.g. 'Manager and above'.
 */
const ROLE_RANK = {
  Viewer:  0,
  Staff:   1,
  Manager: 2,
  Admin:   3,
};

/**
 * Middleware factory.
 * Call with one or more allowed role names (exact match).
 *
 * @param {...string} roles - Allowed roles, e.g. authorizeRoles('Admin', 'Manager')
 * @returns {import('express').RequestHandler}
 *
 * @example
 *  // Only Admins
 *  router.delete('/:id', protect.any, authorizeRoles('Admin'), ctrl.delete)
 *
 *  // Manager OR Admin
 *  router.post('/validate', protect.any, authorizeRoles('Admin','Manager'), ctrl.validate)
 *
 *  // Staff, Manager, or Admin (everyone except Viewers)
 *  router.post('/', protect.any, authorizeRoles('Admin','Manager','Staff'), ctrl.create)
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const userRole = req.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${userRole}.`,
      });
    }
    next();
  };
}

/**
 * Minimum-rank middleware factory (role hierarchy check).
 * Allows the specified role AND any role ranked above it.
 *
 * @param {string} minRole - Minimum role rank required.
 * @example  authorizeMinRole('Manager') — allows Manager and Admin
 */
function authorizeMinRole(minRole) {
  const minRank = ROLE_RANK[minRole] ?? 0;
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const userRank = ROLE_RANK[req.user.role] ?? -1;
    if (userRank < minRank) {
      return res.status(403).json({
        error: `Access denied. Minimum role required: ${minRole}. Your role: ${req.user.role}.`,
      });
    }
    next();
  };
}

module.exports = { authorizeRoles, authorizeMinRole, ROLE_RANK };
