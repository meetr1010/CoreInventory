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
  { key: 'from',      label: 'From' },
  { key: 'to',        label: 'To' },
  { key: 'reference', label: 'Reference' },
  { key: 'status',    label: 'Status' },
  { key: 'date',      label: 'Date' },
]

const orderColumns = [
  { key: 'id',        label: 'ID' },
  { key: 'type',      label: 'Order Type' },
  { key: 'product',   label: 'Product' },
  { key: 'qty',       label: 'Qty' },
  { key: 'from',      label: 'From' },
  { key: 'to',        label: 'To' },
  { key: 'reference', label: 'Reference' },
  { key: 'status',    label: 'Status' },
  { key: 'date',      label: 'Date' },
]

/* ── Filter options ── */
const TABS = ['All', 'Movement History', 'Order History']
const MOVE_TYPES = ['All', 'Incoming', 'Outgoing', 'Moving']
const ORDER_TYPES = ['All', 'Purchase Order', 'Sales Order']
const STATUSES = ['All', 'Completed', 'In Transit', 'Pending', 'Received', 'Fulfilled', 'Ordered', 'Canceled']

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [activeTab, setActiveTab] = useState('All')
  const [moveType, setMoveType]   = useState('All')
  const [orderType, setOrderType] = useState('All')
  const [status, setStatus]       = useState('All')

  useEffect(() => {
    fetchHistory().then((data) => { setHistory(data); setLoading(false) })
  }, [])

  const resetFilters = () => {
    setMoveType('All')
    setOrderType('All')
    setStatus('All')
  }

  /* ── Split data ── */
  const movements = useMemo(() => history.filter((h) => h.moveType === 'movement'), [history])
  const orders    = useMemo(() => history.filter((h) => h.moveType === 'order'), [history])

  /* ── Apply filters ── */
  const filteredMovements = useMemo(() => {
    return movements
      .filter((m) => moveType === 'All' || m.type === moveType)
      .filter((m) => status === 'All' || m.status === status)
      .map((m) => ({ ...m, date: formatDate(m.date) }))
  }, [movements, moveType, status])

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => orderType === 'All' || o.type === orderType)
      .filter((o) => status === 'All' || o.status === status)
      .map((o) => ({ ...o, date: formatDate(o.date) }))
  }, [orders, orderType, status])

  const hasActiveFilter = moveType !== 'All' || orderType !== 'All' || status !== 'All'
  const showMovements = activeTab === 'All' || activeTab === 'Movement History'
  const showOrders    = activeTab === 'All' || activeTab === 'Order History'

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <Sidebar />
      <main className="ml-60 pt-16">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">History</h2>
            <p className="text-sm text-gray-400 mt-1">
              Complete log of product movements (incoming, outgoing, transfers) and order history.
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

          {/* Filters */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-base">Filters</h3>
              {hasActiveFilter && (
                <button onClick={resetFilters} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Reset all
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {showMovements && (
                <FilterSelect label="Movement Type" value={moveType} onChange={setMoveType} options={MOVE_TYPES} />
              )}
              {showOrders && (
                <FilterSelect label="Order Type" value={orderType} onChange={setOrderType} options={ORDER_TYPES} />
              )}
              <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUSES} />
            </div>
          </div>

          {/* Tables */}
          {loading ? (
            <p className="text-gray-500">Loading history…</p>
          ) : (
            <div className="space-y-8">
              {showMovements && (
                <HistoryTable
                  columns={movementColumns}
                  data={filteredMovements}
                  caption={`Movement History${moveType !== 'All' ? ` — ${moveType}` : ''} (${filteredMovements.length})`}
                />
              )}
              {showOrders && (
                <HistoryTable
                  columns={orderColumns}
                  data={filteredOrders}
                  caption={`Order History${orderType !== 'All' ? ` — ${orderType}` : ''} (${filteredOrders.length})`}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
