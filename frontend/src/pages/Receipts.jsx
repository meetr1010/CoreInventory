import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import ProductTable from '../components/ProductTable'
import { fetchRecentReceipts, createReceipt, submitReceipt, fetchWarehouses, fetchProducts } from '../services/api'
import { formatDate } from '../utils/helpers'

const receiptColumns = [
  { key: 'id',       label: 'ID' },
  { key: 'reference',label: 'Reference' },
  { key: 'warehouse',label: 'Warehouse' },
  { key: 'status',   label: 'Status' },
  { key: 'date',     label: 'Date' },
  { key: 'action',   label: 'Action' },
]

const statusBadge = {
  draft:     'bg-amber-600/25 text-amber-400',
  confirmed: 'bg-emerald-600/25 text-emerald-400',
  canceled:  'bg-red-600/25 text-red-400',
}

export default function Receipts() {
  const [receipts, setReceipts]     = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [products, setProducts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [toast, setToast]           = useState(null)
  const [error, setError]           = useState('')
  const [showForm, setShowForm]     = useState(false)

  // New receipt form fields
  const [form, setForm] = useState({ reference: '', warehouseId: '', notes: '' })
  // Validate modal
  const [validating, setValidating] = useState(null) // receipt id
  const [lines, setLines] = useState([{ productId: '', quantity: 1 }])

  useEffect(() => {
    Promise.all([fetchRecentReceipts(), fetchWarehouses(), fetchProducts()]).then(([r, w, p]) => {
      setReceipts(r); setWarehouses(w); setProducts(p); setLoading(false)
    }).catch(err => { setError(err.message); setLoading(false) })
  }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.reference || !form.warehouseId) return setError('Reference and warehouse are required.')
    try {
      await createReceipt({ reference: form.reference, warehouseId: Number(form.warehouseId), notes: form.notes })
      showToast('Receipt draft created! Now validate to add stock.')
      setForm({ reference: '', warehouseId: '', notes: '' })
      setShowForm(false)
      const updated = await fetchRecentReceipts()
      setReceipts(updated)
    } catch (err) { setError(err.message) }
  }

  const handleValidate = async (receiptId) => {
    if (lines.some(l => !l.productId || l.quantity <= 0)) return setError('All lines need a product and quantity > 0.')
    try {
      await submitReceipt({ receiptId, lines: lines.map(l => ({ productId: Number(l.productId), quantity: Number(l.quantity) })) })
      showToast('Receipt confirmed! Stock added to warehouse. ✓')
      setValidating(null); setLines([{ productId: '', quantity: 1 }])
      const updated = await fetchRecentReceipts()
      setReceipts(updated)
    } catch (err) { setError(err.message) }
  }

  const enriched = receipts.map(r => ({
    ...r,
    warehouse: r.warehouse_name || r.warehouse,
    date: formatDate(r.received_at || r.created_at),
    status: <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge[r.status] || ''}`}>{r.status}</span>,
    action: r.status === 'draft'
      ? <button onClick={() => { setValidating(r.id); setError('') }} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg transition-colors">Validate</button>
      : r.status === 'confirmed'
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
              <h2 className="text-2xl font-bold text-white">Receipts</h2>
              <p className="text-sm text-gray-400 mt-1">Receive new stock into your warehouses.</p>
            </div>
            <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">
              <span className="text-lg leading-none">+</span> New Receipt
            </button>
          </div>

          {error && <div className="mb-4 px-4 py-3 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-sm">{error} <button onClick={() => setError('')} className="ml-3 underline text-xs">Dismiss</button></div>}
          {toast && <div className="mb-4 px-4 py-3 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium">{toast}</div>}

          {/* Create Receipt Form */}
          {showForm && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 mb-6">
              <h3 className="text-white font-semibold mb-4">New Receipt Draft</h3>
              <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-400 mb-1 block">Reference *</label>
                  <input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="REC-2026-010" className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Warehouse *</label>
                  <select value={form.warehouseId} onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))} className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white">
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select></div>
                <div className="col-span-2"><label className="text-xs text-gray-400 mb-1 block">Notes</label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white" /></div>
                <div className="col-span-2 flex gap-3">
                  <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">Create Draft</button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Validate Modal */}
          {validating && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg">
                <h3 className="text-white font-semibold mb-4">Validate Receipt #{validating}</h3>
                <p className="text-xs text-gray-400 mb-4">Add each product received. Stock will be added to the warehouse atomically.</p>
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
                <button onClick={() => setLines(ls => [...ls, { productId: '', quantity: 1 }])} className="text-emerald-400 text-sm mb-4 hover:text-emerald-300">+ Add line</button>
                <div className="flex gap-3">
                  <button onClick={() => handleValidate(validating)} className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">✓ Confirm & Add Stock</button>
                  <button onClick={() => { setValidating(null); setLines([{ productId: '', quantity: 1 }]) }} className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-gray-500">Loading receipts…</p>
          ) : (
            <ProductTable columns={receiptColumns} data={enriched} caption={`Receipts (${enriched.length})`} />
          )}
        </div>
      </main>
    </div>
  )
}
