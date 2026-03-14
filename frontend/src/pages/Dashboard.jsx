import { useEffect, useState, useMemo } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import ProductTable from '../components/ProductTable'
import { fetchDashboardKPIs, fetchOperations } from '../services/api'
import { formatNumber, formatDate } from '../utils/helpers'
import {
  HiOutlineCube,
  HiOutlineExclamation,
  HiOutlineClipboardList,
  HiOutlineTruck,
  HiOutlineSwitchHorizontal,
} from 'react-icons/hi'

/* ───── KPI configuration ───── */
const kpiConfig = [
  { key: 'totalProducts',     label: 'Total Products in Stock', icon: HiOutlineCube,               color: { bg: 'bg-indigo-600/20',  text: 'text-indigo-400',  ring: 'ring-indigo-500/20' }},
  { key: 'lowStockOutOfStock', label: 'Low / Out of Stock',      icon: HiOutlineExclamation,        color: { bg: 'bg-red-600/20',     text: 'text-red-400',     ring: 'ring-red-500/20' }},
  { key: 'pendingReceipts',    label: 'Pending Receipts',        icon: HiOutlineClipboardList,      color: { bg: 'bg-amber-600/20',   text: 'text-amber-400',   ring: 'ring-amber-500/20' }},
  { key: 'pendingDeliveries',  label: 'Pending Deliveries',      icon: HiOutlineTruck,              color: { bg: 'bg-emerald-600/20', text: 'text-emerald-400', ring: 'ring-emerald-500/20' }},
  { key: 'internalTransfers',  label: 'Internal Transfers',      icon: HiOutlineSwitchHorizontal,   color: { bg: 'bg-purple-600/20',  text: 'text-purple-400',  ring: 'ring-purple-500/20' }},
]

/* ───── Filter options (static) ───── */
const DOC_TYPES = ['All', 'Receipt', 'Delivery', 'Internal', 'Adjustment']
const STATUSES  = ['All', 'Draft', 'Waiting', 'Ready', 'Done', 'Canceled']
// WAREHOUSES and CATEGORIES are derived dynamically from real data below

/* ───── Status badge colors ───── */
const statusColors = {
  Draft:    'bg-gray-600/30 text-gray-300',
  Waiting:  'bg-amber-600/25 text-amber-400',
  Ready:    'bg-blue-600/25 text-blue-400',
  Done:     'bg-emerald-600/25 text-emerald-400',
  Canceled: 'bg-red-600/25 text-red-400',
}

/* ───── Table columns ───── */
const columns = [
  { key: 'id',        label: 'ID' },
  { key: 'reference', label: 'Reference' },
  { key: 'docType',   label: 'Type' },
  { key: 'product',   label: 'Product' },
  { key: 'qty',       label: 'Qty' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'status',    label: 'Status' },
  { key: 'date',      label: 'Date' },
]

/* ───── Reusable filter dropdown ───── */
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer appearance-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

/* ═════════════════════════════════════════════
   Dashboard Component
   ═════════════════════════════════════════════ */
export default function Dashboard() {
  const [kpis, setKpis]             = useState(null)
  const [operations, setOperations] = useState([])

  // Filter state
  const [docType, setDocType]       = useState('All')
  const [status, setStatus]         = useState('All')
  const [warehouse, setWarehouse]   = useState('All')
  const [category, setCategory]     = useState('All')

  useEffect(() => {
    fetchDashboardKPIs().then(setKpis)
    fetchOperations().then(setOperations)
  }, [])

  /* ── Derive filter options from real data ── */
  const warehouses = useMemo(() => {
    const vals = [...new Set(operations.map(o => o.warehouse).filter(Boolean))]
    return ['All', ...vals.sort()]
  }, [operations])

  const categories = useMemo(() => {
    const vals = [...new Set(operations.map(o => o.category).filter(c => c && c !== '—'))]
    return ['All', ...vals.sort()]
  }, [operations])

  /* ── Apply filters ── */
  const filtered = useMemo(() => {
    return operations.filter((op) => {
      if (docType   !== 'All' && op.docType   !== docType)   return false
      if (status    !== 'All' && op.status    !== status)    return false
      if (warehouse !== 'All' && op.warehouse !== warehouse) return false
      if (category  !== 'All' && op.category  !== category)  return false
      return true
    })
  }, [operations, docType, status, warehouse, category])

  /* ── Enrich rows for display ── */
  const tableData = useMemo(() => {
    return filtered.map((op) => ({
      ...op,
      date: formatDate(op.date),
      status: (
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[op.status] || ''}`}
        >
          {op.status}
        </span>
      ),
    }))
  }, [filtered])

  const resetFilters = () => {
    setDocType('All')
    setStatus('All')
    setWarehouse('All')
    setCategory('All')
  }

  const hasActiveFilter = docType !== 'All' || status !== 'All' || warehouse !== 'All' || category !== 'All'

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <Sidebar />

      <main className="ml-60 pt-16">
        <div className="p-8">
          {/* ── Page Header ── */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Dashboard</h2>
            <p className="text-sm text-gray-400 mt-1">
              A real-time overview of your warehouse operations.
            </p>
          </div>

          {/* ── KPI Cards ── */}
          {kpis ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-5 mb-10">
              {kpiConfig.map(({ key, label, icon: Icon, color }) => (
                <div
                  key={key}
                  className={`relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-5 ring-1 ${color.ring} transition-transform hover:scale-[1.02]`}
                >
                  {/* Decorative blob */}
                  <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-30 ${color.bg}`} />

                  <div className="relative z-10">
                    <div className={`w-11 h-11 rounded-lg ${color.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${color.text}`} />
                    </div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 leading-snug">
                      {label}
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${color.text}`}>
                      {formatNumber(kpis[key])}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 mb-10">Loading KPIs…</p>
          )}

          {/* ── Dynamic Filters ── */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-base">Filters</h3>
              {hasActiveFilter && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Reset all
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <FilterSelect label="Document Type" value={docType}   onChange={setDocType}   options={DOC_TYPES} />
              <FilterSelect label="Status"        value={status}    onChange={setStatus}    options={STATUSES} />
              <FilterSelect label="Warehouse"     value={warehouse} onChange={setWarehouse} options={warehouses} />
              <FilterSelect label="Category"      value={category}  onChange={setCategory}  options={categories} />
            </div>
          </div>

          {/* ── Filtered Operations Table ── */}
          <ProductTable
            columns={columns}
            data={tableData}
            caption={`Operations${hasActiveFilter ? ` (${filtered.length} matching)` : ''}`}
          />
        </div>
      </main>
    </div>
  )
}
