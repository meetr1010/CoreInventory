// backend/models/User.js
// Raw SQL queries for Users
// ─────────────────────────────────────────────────────────────

'use strict';

const pool = require('../config/db');

const User = {
  // ── SELECT ─────────────────────────────────────────────────

  /** Return all active users (safe fields only – no OTP secret). */
  async findAll() {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, role, is_active, created_at, updated_at
         FROM users
        WHERE is_active = 1
        ORDER BY name ASC`
    );
    return rows;
  },

  /** Find a single user by primary key. */
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, role, is_active, created_at, updated_at
         FROM users
        WHERE id = ?
        LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  /** Find a user by email. Returns otp_secret and password_hash for auth. */
  async findByEmail(email) {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, role, otp_secret, password_hash, is_active
         FROM users
        WHERE email = ?
        LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  },

  // ── INSERT ─────────────────────────────────────────────────

  /**
   * Create a new user.
   * @param {{ name, email, phone?, role?, otp_secret?, password_hash? }} data
   */
  async create(data) {
    const { name, email, phone = null, role = 'staff', otp_secret = null, password_hash = null } = data;
    const [result] = await pool.query(
      `INSERT INTO users (name, email, phone, role, otp_secret, password_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone, role, otp_secret, password_hash]
    );
    return result.insertId;
  },

  // ── UPDATE ─────────────────────────────────────────────────

  /**
   * Update editable user fields.
   * @param {number} id
   * @param {{ name?, email?, phone?, role?, is_active? }} data
   */
  async update(id, data) {
    const { name, email, phone, role, is_active } = data;
    const [result] = await pool.query(
      `UPDATE users
          SET name      = COALESCE(?, name),
              email     = COALESCE(?, email),
              phone     = COALESCE(?, phone),
              role      = COALESCE(?, role),
              is_active = COALESCE(?, is_active)
        WHERE id = ?`,
      [name ?? null, email ?? null, phone ?? null, role ?? null, is_active ?? null, id]
    );
    return result.affectedRows;
  },

  /** Update only the OTP secret (called during auth flow). */
  async updateOtpSecret(id, otpSecret) {
    const [result] = await pool.query(
      `UPDATE users SET otp_secret = ? WHERE id = ?`,
      [otpSecret, id]
    );
    return result.affectedRows;
  },

  /** Soft-delete: mark user inactive. */
  async deactivate(id) {
    const [result] = await pool.query(
      `UPDATE users SET is_active = 0 WHERE id = ?`,
      [id]
    );
    return result.affectedRows;
  },
};

module.exports = User;
