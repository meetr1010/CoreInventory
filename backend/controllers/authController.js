// backend/controllers/authController.js
// Authentication controller — password login, OTP login, and registration.
// ─────────────────────────────────────────────────────────────

'use strict';

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const User   = require('../models/User');

const JWT_SECRET  = process.env.JWT_SECRET  || 'change_me_in_env';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

// In-memory OTP store (replace with Redis in production)
// Map<email, { otp: string, expiresAt: number, pendingUser?: object }>
const otpStore = new Map();

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

function makeToken(user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// ── POST /api/auth/login ────────────────────────────────────────
/**
 * Password-based login. Finds user by email, checks password, returns JWT.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findByEmail(email);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare password — supports both bcrypt hashes and plain-text legacy passwords
    let valid = false;
    if (user.password_hash) {
      if (user.password_hash.startsWith('$2')) {
        // bcrypt hash — require bcryptjs if available, fall back to direct compare
        try {
          const bcrypt = require('bcryptjs');
          valid = await bcrypt.compare(password, user.password_hash);
        } catch (_) {
          valid = (password === user.password_hash);
        }
      } else {
        // Plain-text password stored (dev/seed only)
        valid = (password === user.password_hash);
      }
    }

    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = makeToken(user);
    return res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/register ─────────────────────────────────────
/**
 * Register a new user. Generates OTP and stores pending user data in memory.
 * The user is only saved to DB after OTP is verified.
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required.' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password if bcryptjs is available
    let password_hash = password;
    try {
      const bcrypt = require('bcryptjs');
      password_hash = await bcrypt.hash(password, 10);
    } catch (_) {
      // bcryptjs not installed — store plain text (dev only)
    }

    const otp       = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore.set(email.toLowerCase(), {
      otp,
      expiresAt,
      pendingUser: { name: name.trim(), email: email.toLowerCase(), password_hash, role: role || 'staff' },
    });

    console.log(`[AUTH] Registration OTP for ${email}: ${otp}`); // remove in production

    res.json({
      message: 'OTP sent. Please verify your email.',
      otp, // remove in production
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/register/verify-otp ─────────────────────────
/**
 * Verify the OTP for registration, create the user in DB, return JWT.
 */
async function verifyRegisterOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const key   = email.toLowerCase();
    const stored = otpStore.get(key);
    if (!stored) {
      return res.status(401).json({ error: 'No OTP requested for this email.' });
    }
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key);
      return res.status(401).json({ error: 'OTP has expired. Please register again.' });
    }
    if (stored.otp !== String(otp)) {
      return res.status(401).json({ error: 'Incorrect OTP.' });
    }

    otpStore.delete(key);

    // Create user
    const { pendingUser } = stored;
    const userId = await User.create(pendingUser);
    const user   = await User.findById(userId);

    const token = makeToken(user);
    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/request-otp ───────────────────────────────────
/**
 * Lookup user by email, generate a 6-digit OTP, store it.
 * Role is auto-detected from the DB — no need to pass it from the frontend.
 */
async function requestOtp(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await User.findByEmail(email);
    if (!user || !user.is_active) {
      return res.json({ message: 'If this email exists, an OTP has been sent.' });
    }

    const otp       = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore.set(user.id.toString(), { otp, expiresAt });

    console.log(`[AUTH] OTP for ${email} (${user.role}): ${otp}`); // remove in production

    res.json({
      message: 'OTP sent.',
      role: user.role, // returned so frontend can pass it to verify-otp
      otp, // remove in production
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/verify-otp ──────────────────────────────────────
async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const user = await User.findByEmail(email);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const stored = otpStore.get(user.id.toString());
    if (!stored) {
      return res.status(401).json({ error: 'No OTP requested for this account.' });
    }
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(user.id.toString());
      return res.status(401).json({ error: 'OTP has expired. Please request a new one.' });
    }

    const valid = crypto.timingSafeEqual(
      Buffer.from(stored.otp),
      Buffer.from(String(otp).padEnd(stored.otp.length))
    ) && stored.otp === String(otp);

    if (!valid) {
      return res.status(401).json({ error: 'Incorrect OTP.' });
    }

    otpStore.delete(user.id.toString());

    const token = makeToken(user);
    res.json({
      message: 'Login successful.',
      token,

      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/auth/me ──────────────────────────────────────────
async function me(req, res) {
  const { id, name, email, role } = req.user;
  res.json({ id, name, email, role });
}

// ── GET /api/auth/users ─────────────────────────────────────
// Admin-only: list all users (no sensitive fields)
async function listUsers(req, res, next) {
  try {
    const [rows] = await require('../config/db').query(
      `SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC`
    );
    res.json({ data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, register, verifyRegisterOtp, requestOtp, verifyOtp, me, listUsers };
