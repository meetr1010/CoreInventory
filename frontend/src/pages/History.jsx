import { useEffect, useState, useMemo } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import HistoryTable from '../components/HistoryTable'
import { fetchHistory } from '../services/api'
import { formatDate } from '../utils/helpers'

/* ── Column definitions ── */
const movementColumns = [
  { key: 'id',        label: 'ID' },
  { key: 'type',      label: 'Direction' },
  { key: 'product',   label: 'Product' },
  { key: 'qty',       label: 'Qty' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'reference', label: 'Reference' },
  { key: 'performer', label: 'By' },
  { key: 'date',      label: 'Date' },
]

/* ── Filter options ── */
const TABS = ['All', 'Receipts', 'Deliveries', 'Transfers', 'Adjustments']
const MOVE_TYPES = ['All', 'receipt', 'delivery', 'transfer_out', 'transfer_in', 'adjustment']
const MOVE_TYPE_LABELS = {
  receipt:     'Receipt ↓',
  delivery:    'Delivery ↑',
  transfer_out:'Transfer Out →',
  transfer_in: 'Transfer In ←',
  adjustment:  'Adjustment ±',
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none"
      >
        {options.map((o) => <option key={o} value={o}>{MOVE_TYPE_LABELS[o] || o}</option>)}
      </select>
    </div>
  )
}

const TYPE_BADGE = {
  receipt:     'bg-emerald-600/20 text-emerald-400',
  delivery:    'bg-red-600/20 text-red-400',
  transfer_out:'bg-amber-600/20 text-amber-400',
  transfer_in: 'bg-blue-600/20 text-blue-400',
  adjustment:  'bg-purple-600/20 text-purple-400',
}

export default function History() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // Filters
  const [activeTab, setActiveTab] = useState('All')
  const [moveType, setMoveType]   = useState('All')

  useEffect(() => {
    const tabToType = {
      Receipts:    'receipt',
      Deliveries:  'delivery',
      Transfers:   'transfer_out',
      Adjustments: 'adjustment',
    }
    const typeFilter = activeTab !== 'All' ? tabToType[activeTab] : undefined

    setLoading(true)
    fetchHistory({ limit: 100, movementType: typeFilter })
      .then((res) => {
        // res = { data: [...], pagination: {...} }
        const mapped = (res.data || []).map((m) => ({
          id:        m.id,
          type: (
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_BADGE[m.movement_type] || ''}`}>
              {MOVE_TYPE_LABELS[m.movement_type] || m.movement_type}
            </span>
          ),
          product:   m.product_name,
          qty:       m.quantity,
          warehouse: m.warehouse_name,
          reference: m.reference_type ? `${m.reference_type} #${m.reference_id}` : '—',
          performer: m.performed_by_name,
          date:      formatDate(m.moved_at?.slice(0, 10)),
        }))
        setRows(mapped)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load history.')
        setLoading(false)
      })
  }, [activeTab])

  /* ── Apply local moveType filter ── */
  const filtered = useMemo(() => {
    if (moveType === 'All') return rows
    // The type cell is now JSX, filter on raw data not possible — handled server-side via activeTab
    return rows
  }, [rows, moveType])

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <Sidebar />
      <main className="ml-60 pt-16">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Movement History</h2>
            <p className="text-sm text-gray-400 mt-1">
              Complete immutable ledger of all stock movements — receipts, deliveries, transfers, and adjustments.
            </p>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mb-6 bg-gray-900 rounded-lg p-1 border border-gray-800 w-fit">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tables */}
          {loading ? (
            <div className="flex items-center gap-3 text-gray-500 py-12">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Loading history…
            </div>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-3">📋</p>
              <p>No movements found for this filter.</p>
            </div>
          ) : (
            <HistoryTable
              columns={movementColumns}
              data={filtered}
              caption={`${activeTab === 'All' ? 'All Movements' : activeTab} (${filtered.length})`}
            />
          )}
        </div>
      </main>
    </div>
  )
}
