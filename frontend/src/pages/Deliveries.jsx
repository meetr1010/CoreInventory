import { useEffect, useState, useMemo } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import ProductTable from '../components/ProductTable'
import { fetchDeliveries } from '../services/api'
import { formatDate } from '../utils/helpers'

const columns = [
  { key: 'id',        label: 'ID' },
  { key: 'reference', label: 'Reference' },
  { key: 'product',   label: 'Product' },
  { key: 'qty',       label: 'Qty' },
  { key: 'customer',  label: 'Customer' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'status',    label: 'Status' },
  { key: 'date',      label: 'Date' },
]

const STATUS_OPTIONS = ['All', 'Draft', 'Waiting', 'Ready', 'Done', 'Canceled']
const statusBadge = {
  Draft:    'bg-gray-600/30 text-gray-300',
  Waiting:  'bg-amber-600/25 text-amber-400',
  Ready:    'bg-blue-600/25 text-blue-400',
  Done:     'bg-emerald-600/25 text-emerald-400',
  Canceled: 'bg-red-600/25 text-red-400',
}

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    fetchDeliveries().then((d) => { setDeliveries(d); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    const list = statusFilter === 'All' ? deliveries : deliveries.filter((d) => d.status === statusFilter)
    return list.map((d) => ({
      ...d,
      date: formatDate(d.date),
      status: (
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge[d.status] || ''}`}>
          {d.status}
        </span>
      ),
    }))
  }, [deliveries, statusFilter])

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <Sidebar />
      <main className="ml-60 pt-16">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Deliveries</h2>
              <p className="text-sm text-gray-400 mt-1">Track outgoing product deliveries to customers.</p>
            </div>
          </div>

          {/* Filter */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none"
              >
                {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
              {statusFilter !== 'All' && (
                <button onClick={() => setStatusFilter('All')} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-gray-500">Loading deliveries…</p>
          ) : (
            <ProductTable columns={columns} data={filtered} caption={`Outgoing Deliveries${statusFilter !== 'All' ? ` — ${statusFilter}` : ''}`} />
          )}
        </div>
      </main>
    </div>
  )
}
