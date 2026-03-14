// backend/server.js
// Entry point for the IMS Express server
// ─────────────────────────────────────────────────────────────

'use strict';

require('dotenv').config(); // load .env before anything else

const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Core Middleware ───────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5174';
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Always allow any localhost port during development
    if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    // Otherwise check against configured origin
    if (origin === ALLOWED_ORIGIN) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────
const authRoutes      = require('./routes/authRoutes');
const productRoutes   = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const transferRoutes  = require('./routes/transferRoutes');
const historyRoutes   = require('./routes/historyRoutes');

app.use('/api/auth',      authRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/ops',       transferRoutes);   // receipts | deliveries | transfers
app.use('/api/history',   historyRoutes);

// ── 404 catch-all ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Global error handler ──────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[SERVER] IMS API running → http://localhost:${PORT}`);
});

module.exports = app;
