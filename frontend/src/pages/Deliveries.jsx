import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import ProductTable from '../components/ProductTable'
import { fetchDeliveries, createDelivery, submitDelivery, fetchWarehouses, fetchProducts } from '../services/api'
import { formatDate } from '../utils/helpers'

const columns = [
  { key: 'id',        label: 'ID' },
  { key: 'reference', label: 'Reference' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'destination', label: 'Destination' },
  { key: 'status',    label: 'Status' },
  { key: 'date',      label: 'Date' },
  { key: 'action',    label: 'Action' },
]

const STATUS_OPTIONS = ['All', 'draft', 'confirmed', 'canceled']
const statusBadge = {
  draft:     'bg-amber-600/25 text-amber-400',
  confirmed: 'bg-emerald-600/25 text-emerald-400',
  canceled:  'bg-red-600/25 text-red-400',
}

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [toast, setToast]   = useState(null)
  const [error, setError]   = useState('')
  const [showForm, setShowForm] = useState(false)

  // New delivery form
  const [form, setForm] = useState({ reference: '', warehouseId: '', destination: '', notes: '' })
  // Validation lines (product rows for a selected draft)
  const [validating, setValidating] = useState(null) // delivery id
  const [lines, setLines]   = useState([{ productId: '', quantity: 1 }])

  useEffect(() => {
    Promise.all([fetchDeliveries(), fetchWarehouses(), fetchProducts()]).then(([d, w, p]) => {
      setDeliveries(d)
      setWarehouses(w)
      setProducts(p)
      setLoading(false)
    }).catch((err) => { setError(err.message); setLoading(false) })
  }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.reference || !form.warehouseId) return setError('Reference and warehouse are required.')
    try {
      const res = await createDelivery({ reference: form.reference, warehouseId: Number(form.warehouseId), destination: form.destination, notes: form.notes })
      showToast('Delivery draft created! Now add lines and validate.')
      setForm({ reference: '', warehouseId: '', destination: '', notes: '' })
      setShowForm(false)
      const updated = await fetchDeliveries()
      setDeliveries(updated)
    } catch (err) { setError(err.message) }
  }

  const handleValidate = async (deliveryId) => {
    if (lines.some(l => !l.productId || l.quantity <= 0)) return setError('All lines need a product and quantity > 0.')
    try {
      await submitDelivery({ deliveryId, lines: lines.map(l => ({ productId: Number(l.productId), quantity: Number(l.quantity) })) })
      showToast('Delivery confirmed and stock reduced! ✓')
      setValidating(null)
      setLines([{ productId: '', quantity: 1 }])
      const updated = await fetchDeliveries()
      setDeliveries(updated)
    } catch (err) { setError(err.message) }
  }

  const filtered = (statusFilter === 'All' ? deliveries : deliveries.filter(d => d.status === statusFilter))
    .map(d => ({
      ...d,
      warehouse: d.warehouse_name,
      destination: d.destination || '—',
      date: formatDate(d.dispatched_at || d.created_at),
      status: <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge[d.status] || ''}`}>{d.status}</span>,
      action: d.status === 'draft'
        ? <button onClick={() => { setValidating(d.id); setError('') }} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg transition-colors">Validate</button>
        : d.status === 'confirmed'
        ? <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600/20 text-emerald-400">✓ Confirmed</span>
        : <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-red-600/20 text-red-400">✗ Canceled</span>,
    }))

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar /><Sidebar />
      <main className="ml-60 pt-16">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Deliveries</h2>
              <p className="text-sm text-gray-400 mt-1">Track outgoing product deliveries.</p>
            </div>
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
            >
              <span className="text-lg leading-none">+</span> New Delivery
            </button>
          </div>

          {error && <div className="mb-4 px-4 py-3 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-sm">{error}<button onClick={() => setError('')} className="ml-3 underline text-xs">Dismiss</button></div>}
          {toast && <div className="mb-4 px-4 py-3 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium">{toast}</div>}

          {/* Create Form */}
          {showForm && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 mb-6">
              <h3 className="text-white font-semibold mb-4">New Delivery Draft</h3>
              <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-400 mb-1 block">Reference *</label>
                  <input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="DEL-2026-001" className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Warehouse *</label>
                  <select value={form.warehouseId} onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))} className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white">
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Destination</label>
                  <input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="Customer / Address" className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Notes</label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white" /></div>
                <div className="col-span-2 flex gap-3">
                  <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">Create Draft</button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Validate Lines Modal */}
          {validating && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg">
                <h3 className="text-white font-semibold mb-4">Validate Delivery #{validating}</h3>
                <p className="text-xs text-gray-400 mb-4">Add each product line to dispatch. Stock will be reduced atomically.</p>
                {lines.map((line, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <select value={line.productId} onChange={e => setLines(ls => ls.map((l,j) => j===i ? {...l, productId: e.target.value} : l))} className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white">
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                    <input type="number" min="1" value={line.quantity} onChange={e => setLines(ls => ls.map((l,j) => j===i ? {...l, quantity: e.target.value} : l))} className="w-20 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white" />
                    {lines.length > 1 && <button onClick={() => setLines(ls => ls.filter((_,j) => j!==i))} className="text-red-400 hover:text-red-300 text-sm px-2">✕</button>}
                  </div>
                ))}
                <button onClick={() => setLines(ls => [...ls, { productId: '', quantity: 1 }])} className="text-indigo-400 text-sm mb-4 hover:text-indigo-300">+ Add line</button>
                <div className="flex gap-3">
                  <button onClick={() => handleValidate(validating)} className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">✓ Confirm & Reduce Stock</button>
                  <button onClick={() => { setValidating(null); setLines([{ productId: '', quantity: 1 }]) }} className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Filter */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none">
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading deliveries…</p>
          ) : (
            <ProductTable columns={columns} data={filtered} caption={`Deliveries${statusFilter !== 'All' ? ` — ${statusFilter}` : ''} (${filtered.length})`} />
          )}
        </div>
      </main>
    </div>
  )
}
