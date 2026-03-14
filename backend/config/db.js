// backend/config/db.js
// MySQL connection pool using mysql2/promise
// ─────────────────────────────────────────────────────────────
// Usage:  const pool = require('./config/db');
//         const [rows] = await pool.query('SELECT 1');
// ─────────────────────────────────────────────────────────────

'use strict';

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'ims_db',
  waitForConnections: true,
  connectionLimit:    Number(process.env.DB_POOL_LIMIT) || 10,
  queueLimit:         0,           // unlimited queue
  timezone:           '+00:00',    // store/retrieve UTC
  charset:            'utf8mb4',
});

// Verify connection at startup (non-fatal; warning only)
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('[DB] Connected to MySQL — database:', process.env.DB_NAME || 'ims_db');
    conn.release();
  } catch (err) {
    console.error('[DB] Could not connect to MySQL:', err.message);
  }
})();

module.exports = pool;
