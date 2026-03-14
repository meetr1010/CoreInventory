// src/services/api.js
// Real API client – replaces all mock data.
// All authenticated calls automatically include the JWT token.
// ─────────────────────────────────────────────────────────────

import axios from 'axios'

// ── Axios instance ────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ims_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalise error messages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      'An unexpected error occurred.'
    return Promise.reject(new Error(message))
  }
)

// ── Auth ──────────────────────────────────────────────────────

/** Password-based login — returns { token, user } and persists to localStorage */
export async function loginWithPassword(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  // data = { token, user: { id, name, email, role } }
  localStorage.setItem('ims_token', data.token)
  localStorage.setItem('ims_user',  JSON.stringify(data.user))
  localStorage.setItem('ims_logged_in', 'true')
  return data
}

/** Register a new user — sends OTP to backend, returns { message, otp (dev only) } */
export async function registerUser(payload) {
  // payload: { name, email, password, role }
  const { data } = await api.post('/auth/register', payload)
  return data
}

/** Verify OTP after registration — creates user in DB, returns JWT */
export async function verifyRegisterOtp(email, otp) {
  const { data } = await api.post('/auth/register/verify-otp', { email, otp })
  localStorage.setItem('ims_token', data.token)
  localStorage.setItem('ims_user',  JSON.stringify(data.user))
  localStorage.setItem('ims_logged_in', 'true')
  return data
}

export async function requestOtp(email) {
  const { data } = await api.post('/auth/request-otp', { email })
  return data // { message, role, otp (dev only) }
}

export async function verifyOtp(email, otp, role) {
  const { data } = await api.post('/auth/verify-otp', { email, otp, role })
  // data = { token, user: { id, name, email, role } }
  localStorage.setItem('ims_token', data.token)
  localStorage.setItem('ims_user',  JSON.stringify(data.user))
  localStorage.setItem('ims_logged_in', 'true')
  return data
}


// ── Dashboard ─────────────────────────────────────────────────

export async function fetchDashboardKPIs() {
  // Fetch dashboard AND pending counts in parallel
  const [{ data }, recRes, delRes, trnRes] = await Promise.all([
    api.get('/inventory/dashboard'),
    api.get('/ops/receipts',   { params: { status: 'draft', limit: 1 } }),
    api.get('/ops/deliveries', { params: { status: 'draft', limit: 1 } }),
    api.get('/ops/transfers',  { params: { status: 'draft', limit: 1 } }),
  ])
  const d = data.data
  return {
    totalProducts:       d.totalProducts,
    totalWarehouses:     d.totalWarehouses,
    totalOnHandValue:    d.totalOnHandValue,
    lowStockOutOfStock:  d.lowStockAlerts.count,
    pendingReceipts:     recRes.data.count   || 0,
    pendingDeliveries:   delRes.data.count   || 0,
    internalTransfers:   trnRes.data.count   || 0,
  }
}

export async function fetchOperations() {
  const { data } = await api.get('/history', { params: { limit: 12 } })
  return data.data.map((m) => ({
    id:        m.id,
    reference: m.reference_id ? `#${m.reference_id}` : `ADJ-${m.id}`,
    docType:   docTypeLabel(m.movement_type),
    status:    'Done',
    warehouse: m.warehouse_name,
    product:   m.product_name,
    category:  m.category || '—',   // now available from backend
    qty:       Number(m.quantity),
    date:      m.moved_at?.slice(0, 10),
  }))
}

function docTypeLabel(type) {
  const map = {
    receipt:     'Receipt',
    delivery:    'Delivery',
    transfer_out:'Internal',
    transfer_in: 'Internal',
    adjustment:  'Adjustment',
  }
  return map[type] || type
}

// ── Products ──────────────────────────────────────────────────

export async function fetchProducts() {
  const [{ data: pData }, { data: sData }] = await Promise.all([
    api.get('/products'),
    api.get('/inventory/stock'),
  ])

  // Build a map: productId → total quantity across all warehouses
  const stockMap = {}
  for (const row of (sData.data || [])) {
    const pid = row.product_id
    stockMap[pid] = (stockMap[pid] || 0) + Number(row.total_quantity ?? row.quantity ?? 0)
  }

  return (pData.data || []).map((p) => {
    const totalQty = stockMap[p.id] || 0
    const minStock = Number(p.min_stock) || 0
    const status   = totalQty === 0 ? 'Out of Stock' : totalQty <= minStock ? 'Low Stock' : 'In Stock'
    return {
      id:       p.id,
      name:     p.name,
      sku:      p.sku,
      category: p.category || '—',
      uom:      p.uom,
      minStock,
      price:    Number(p.unit_cost || 0), // Products.jsx formats this with formatCurrency
      stock:    totalQty,                 // total across all warehouses
      status,
    }
  })
}

export async function createProduct(payload) {
  const { data } = await api.post('/products', payload)
  return data
}

export async function updateProduct(id, payload) {
  const { data } = await api.patch(`/products/${id}`, payload)
  return data
}

// ── Receipts ──────────────────────────────────────────────────

export async function fetchRecentReceipts() {
  const { data } = await api.get('/ops/receipts', { params: { limit: 10 } })
  return data.data
}

export async function createReceipt(payload) {
  // payload: { reference, warehouseId, notes }
  const { data } = await api.post('/ops/receipts', payload)
  return data
}

export async function submitReceipt({ receiptId, lines }) {
  // "Validate" button: POST /ops/receipts/:id/validate
  const { data } = await api.post(`/ops/receipts/${receiptId}/validate`, { lines })
  return data
}

// ── Deliveries ────────────────────────────────────────────────

export async function fetchDeliveries() {
  const { data } = await api.get('/ops/deliveries', { params: { limit: 20 } })
  return data.data
}

export async function createDelivery(payload) {
  const { data } = await api.post('/ops/deliveries', payload)
  return data
}

export async function submitDelivery({ deliveryId, lines }) {
  const { data } = await api.post(`/ops/deliveries/${deliveryId}/validate`, { lines })
  return data
}

// ── Transfers ─────────────────────────────────────────────────

export async function fetchTransfers() {
  const { data } = await api.get('/ops/transfers', { params: { limit: 20 } })
  return data.data
}

export async function createTransfer(payload) {
  // payload: { reference, fromWarehouseId, toWarehouseId, notes }
  const { data } = await api.post('/ops/transfers', payload)
  return data
}

export async function submitTransfer({ transferId, lines }) {
  const { data } = await api.post(`/ops/transfers/${transferId}/validate`, { lines })
  return data
}

// ── Stock Adjustment ──────────────────────────────────────────

export async function submitAdjustment({ productId, warehouseId, physicalQty, notes }) {
  const { data } = await api.post('/inventory/adjust', { productId, warehouseId, physicalQty, notes })
  return data
}

// ── History ───────────────────────────────────────────────────

export async function fetchHistory({ page = 1, limit = 25, ...filters } = {}) {
  const { data } = await api.get('/history', { params: { page, limit, ...filters } })
  return data // { data[], pagination }
}

// ── Warehouses ────────────────────────────────────────────────

export async function fetchWarehouses() {
  const { data } = await api.get('/inventory/warehouses')
  return data.data
}

// ── Low Stock Alerts ──────────────────────────────────────────

export async function fetchLowStockAlerts() {
  const { data } = await api.get('/products/low-stock')
  return data.data
}

export default api
