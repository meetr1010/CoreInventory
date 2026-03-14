import axios from 'axios'

// ── Axios instance ──
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Dashboard KPIs ──
export async function fetchDashboardKPIs() {
  return {
    totalProducts: 248,
    lowStockOutOfStock: 18,
    pendingReceipts: 14,
    pendingDeliveries: 9,
    internalTransfers: 5,
  }
}

// ── Dashboard Operations (filterable) ──
export async function fetchOperations() {
  return [
    { id: 'REC-001', reference: 'PO-2026-0042', docType: 'Receipt',    status: 'Ready',    warehouse: 'Main Warehouse',   category: 'Electronics', product: 'Wireless Mouse',       qty: 200, date: '2026-03-14' },
    { id: 'REC-002', reference: 'PO-2026-0039', docType: 'Receipt',    status: 'Waiting',  warehouse: 'Main Warehouse',   category: 'Electronics', product: 'Mechanical Keyboard',  qty: 50,  date: '2026-03-13' },
    { id: 'DEL-001', reference: 'SO-2026-0118', docType: 'Delivery',   status: 'Done',     warehouse: 'Main Warehouse',   category: 'Accessories', product: 'USB-C Hub',            qty: 30,  date: '2026-03-13' },
    { id: 'DEL-002', reference: 'SO-2026-0120', docType: 'Delivery',   status: 'Ready',    warehouse: 'East Branch',      category: 'Electronics', product: 'Webcam HD 1080p',      qty: 15,  date: '2026-03-12' },
    { id: 'INT-001', reference: 'IT-2026-0007', docType: 'Internal',   status: 'Waiting',  warehouse: 'Main Warehouse',   category: 'Furniture',   product: 'Monitor Stand',        qty: 10,  date: '2026-03-12' },
    { id: 'ADJ-001', reference: 'ADJ-2026-003', docType: 'Adjustment', status: 'Done',     warehouse: 'West Branch',      category: 'Accessories', product: 'Cable Management Kit',  qty: -5,  date: '2026-03-11' },
    { id: 'REC-003', reference: 'PO-2026-0041', docType: 'Receipt',    status: 'Draft',    warehouse: 'East Branch',      category: 'Furniture',   product: 'Desk Lamp LED',        qty: 100, date: '2026-03-11' },
    { id: 'DEL-003', reference: 'SO-2026-0115', docType: 'Delivery',   status: 'Canceled', warehouse: 'West Branch',      category: 'Electronics', product: 'Noise-Cancel Headset', qty: 8,   date: '2026-03-10' },
    { id: 'INT-002', reference: 'IT-2026-0006', docType: 'Internal',   status: 'Done',     warehouse: 'East Branch',      category: 'Electronics', product: 'Wireless Mouse',       qty: 25,  date: '2026-03-10' },
    { id: 'REC-004', reference: 'PO-2026-0038', docType: 'Receipt',    status: 'Done',     warehouse: 'Main Warehouse',   category: 'Accessories', product: 'USB-C Hub',            qty: 150, date: '2026-03-09' },
    { id: 'ADJ-002', reference: 'ADJ-2026-002', docType: 'Adjustment', status: 'Draft',    warehouse: 'Main Warehouse',   category: 'Electronics', product: 'Webcam HD 1080p',      qty: -2,  date: '2026-03-09' },
    { id: 'DEL-004', reference: 'SO-2026-0112', docType: 'Delivery',   status: 'Waiting',  warehouse: 'Main Warehouse',   category: 'Furniture',   product: 'Desk Lamp LED',        qty: 20,  date: '2026-03-08' },
  ]
}

// ── Products ──
export async function fetchProducts() {
  return [
    { id: 1, name: 'Wireless Mouse',      sku: 'WM-1001', category: 'Electronics', stock: 145, price: 29.99,  status: 'In Stock' },
    { id: 2, name: 'Mechanical Keyboard',  sku: 'MK-2010', category: 'Electronics', stock: 5,   price: 79.99,  status: 'Low Stock' },
    { id: 3, name: 'USB-C Hub',            sku: 'UH-3050', category: 'Accessories', stock: 230, price: 45.00,  status: 'In Stock' },
    { id: 4, name: 'Monitor Stand',        sku: 'MS-4002', category: 'Furniture',   stock: 0,   price: 55.00,  status: 'Out of Stock' },
    { id: 5, name: 'Webcam HD 1080p',      sku: 'WC-5010', category: 'Electronics', stock: 88,  price: 64.99,  status: 'In Stock' },
    { id: 6, name: 'Desk Lamp LED',        sku: 'DL-6003', category: 'Furniture',   stock: 14,  price: 34.50,  status: 'In Stock' },
    { id: 7, name: 'Noise-Cancel Headset', sku: 'NH-7020', category: 'Electronics', stock: 3,   price: 129.00, status: 'Low Stock' },
    { id: 8, name: 'Cable Management Kit', sku: 'CM-8001', category: 'Accessories', stock: 310, price: 19.99,  status: 'In Stock' },
  ]
}

// ── Receipts ──
export async function submitReceipt(data) {
  console.log('Receipt submitted:', data)
  return { success: true, id: Date.now() }
}

export async function fetchRecentReceipts() {
  return [
    { id: 1, product: 'Wireless Mouse',      quantity: 50,  supplier: 'TechWorld Ltd.',    date: '2026-03-12' },
    { id: 2, product: 'Mechanical Keyboard',  quantity: 20,  supplier: 'KeyMaster Inc.',    date: '2026-03-11' },
    { id: 3, product: 'USB-C Hub',            quantity: 100, supplier: 'ConnectPro',        date: '2026-03-10' },
    { id: 4, product: 'Noise-Cancel Headset', quantity: 15,  supplier: 'AudioPeak Co.',     date: '2026-03-09' },
    { id: 5, product: 'Cable Management Kit', quantity: 200, supplier: 'NeatDesk Supplies', date: '2026-03-08' },
  ]
}

// ── Deliveries ──
export async function fetchDeliveries() {
  return [
    { id: 'DEL-001', reference: 'SO-2026-0118', product: 'USB-C Hub',            qty: 30, customer: 'RetailMax Corp.',   warehouse: 'Main Warehouse', status: 'Done',     date: '2026-03-13' },
    { id: 'DEL-002', reference: 'SO-2026-0120', product: 'Webcam HD 1080p',      qty: 15, customer: 'TechBuy Online',   warehouse: 'East Branch',    status: 'Ready',    date: '2026-03-12' },
    { id: 'DEL-003', reference: 'SO-2026-0115', product: 'Noise-Cancel Headset', qty: 8,  customer: 'SoundShop LLC',    warehouse: 'West Branch',    status: 'Canceled', date: '2026-03-10' },
    { id: 'DEL-004', reference: 'SO-2026-0112', product: 'Desk Lamp LED',        qty: 20, customer: 'OfficeHub Inc.',   warehouse: 'Main Warehouse', status: 'Waiting',  date: '2026-03-08' },
    { id: 'DEL-005', reference: 'SO-2026-0125', product: 'Wireless Mouse',       qty: 60, customer: 'GadgetWorld',      warehouse: 'East Branch',    status: 'Draft',    date: '2026-03-14' },
    { id: 'DEL-006', reference: 'SO-2026-0128', product: 'Cable Management Kit', qty: 45, customer: 'NeatSpace Stores', warehouse: 'Main Warehouse', status: 'Ready',    date: '2026-03-14' },
  ]
}

// ── Transfers ──
export async function submitTransfer(data) {
  console.log('Transfer submitted:', data)
  return { success: true, id: Date.now() }
}

export async function fetchTransfers() {
  return [
    { id: 'INT-001', reference: 'IT-2026-0007', product: 'Monitor Stand',        qty: 10, from: 'Main Warehouse', to: 'East Branch',    status: 'Waiting', date: '2026-03-12' },
    { id: 'INT-002', reference: 'IT-2026-0006', product: 'Wireless Mouse',       qty: 25, from: 'East Branch',   to: 'West Branch',    status: 'Done',    date: '2026-03-10' },
    { id: 'INT-003', reference: 'IT-2026-0008', product: 'USB-C Hub',            qty: 40, from: 'Main Warehouse', to: 'West Branch',    status: 'Draft',   date: '2026-03-13' },
    { id: 'INT-004', reference: 'IT-2026-0009', product: 'Desk Lamp LED',        qty: 15, from: 'West Branch',   to: 'Main Warehouse', status: 'Ready',   date: '2026-03-14' },
    { id: 'INT-005', reference: 'IT-2026-0010', product: 'Mechanical Keyboard',  qty: 8,  from: 'East Branch',   to: 'Main Warehouse', status: 'Done',    date: '2026-03-09' },
  ]
}

// ── History (movement + order) ──
export async function fetchHistory() {
  return [
    // Movement history (Incoming, Outgoing, Internal moves)
    { id: 'MH-001', type: 'Incoming',  moveType: 'movement', product: 'Wireless Mouse',       qty: 200,  from: 'Supplier: TechWorld',   to: 'Main Warehouse',   reference: 'PO-2026-0042', status: 'Completed', date: '2026-03-14' },
    { id: 'MH-002', type: 'Outgoing',  moveType: 'movement', product: 'USB-C Hub',            qty: 30,   from: 'Main Warehouse',        to: 'Customer: RetailMax', reference: 'SO-2026-0118', status: 'Completed', date: '2026-03-13' },
    { id: 'MH-003', type: 'Moving',    moveType: 'movement', product: 'Monitor Stand',        qty: 10,   from: 'Main Warehouse',        to: 'East Branch',        reference: 'IT-2026-0007', status: 'In Transit', date: '2026-03-12' },
    { id: 'MH-004', type: 'Incoming',  moveType: 'movement', product: 'Mechanical Keyboard',  qty: 50,   from: 'Supplier: KeyMaster',   to: 'Main Warehouse',     reference: 'PO-2026-0039', status: 'Pending',    date: '2026-03-13' },
    { id: 'MH-005', type: 'Outgoing',  moveType: 'movement', product: 'Webcam HD 1080p',      qty: 15,   from: 'East Branch',           to: 'Customer: TechBuy',   reference: 'SO-2026-0120', status: 'Completed', date: '2026-03-12' },
    { id: 'MH-006', type: 'Moving',    moveType: 'movement', product: 'Wireless Mouse',       qty: 25,   from: 'East Branch',           to: 'West Branch',         reference: 'IT-2026-0006', status: 'Completed', date: '2026-03-10' },
    { id: 'MH-007', type: 'Incoming',  moveType: 'movement', product: 'USB-C Hub',            qty: 150,  from: 'Supplier: ConnectPro',  to: 'Main Warehouse',      reference: 'PO-2026-0038', status: 'Completed', date: '2026-03-09' },
    { id: 'MH-008', type: 'Outgoing',  moveType: 'movement', product: 'Desk Lamp LED',        qty: 20,   from: 'Main Warehouse',        to: 'Customer: OfficeHub', reference: 'SO-2026-0112', status: 'Pending',   date: '2026-03-08' },

    // Order history
    { id: 'OH-001', type: 'Purchase Order', moveType: 'order', product: 'Wireless Mouse',       qty: 200, from: 'TechWorld Ltd.',      to: 'Main Warehouse',   reference: 'PO-2026-0042', status: 'Received',   date: '2026-03-14' },
    { id: 'OH-002', type: 'Sales Order',    moveType: 'order', product: 'USB-C Hub',            qty: 30,  from: 'Main Warehouse',      to: 'RetailMax Corp.',  reference: 'SO-2026-0118', status: 'Fulfilled',  date: '2026-03-13' },
    { id: 'OH-003', type: 'Purchase Order', moveType: 'order', product: 'Mechanical Keyboard',  qty: 50,  from: 'KeyMaster Inc.',      to: 'Main Warehouse',   reference: 'PO-2026-0039', status: 'Ordered',    date: '2026-03-13' },
    { id: 'OH-004', type: 'Sales Order',    moveType: 'order', product: 'Webcam HD 1080p',      qty: 15,  from: 'East Branch',         to: 'TechBuy Online',   reference: 'SO-2026-0120', status: 'Fulfilled',  date: '2026-03-12' },
    { id: 'OH-005', type: 'Purchase Order', moveType: 'order', product: 'USB-C Hub',            qty: 150, from: 'ConnectPro',          to: 'Main Warehouse',   reference: 'PO-2026-0038', status: 'Received',   date: '2026-03-09' },
    { id: 'OH-006', type: 'Sales Order',    moveType: 'order', product: 'Noise-Cancel Headset', qty: 8,   from: 'West Branch',         to: 'SoundShop LLC',    reference: 'SO-2026-0115', status: 'Canceled',   date: '2026-03-10' },
  ]
}

export default api
