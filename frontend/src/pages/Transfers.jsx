import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import ProductTable from '../components/ProductTable'
import TransferForm from '../components/TransferForm'
import { submitTransfer, fetchTransfers } from '../services/api'
import { formatDate } from '../utils/helpers'

const columns = [
  { key: 'id',        label: 'ID' },
  { key: 'reference', label: 'Reference' },
  { key: 'product',   label: 'Product' },
  { key: 'qty',       label: 'Qty' },
  { key: 'from',      label: 'From' },
  { key: 'to',        label: 'To' },
  { key: 'status',    label: 'Status' },
  { key: 'date',      label: 'Date' },
]

const statusBadge = {
  Draft:    'bg-gray-600/30 text-gray-300',
  Waiting:  'bg-amber-600/25 text-amber-400',
  Ready:    'bg-blue-600/25 text-blue-400',
  Done:     'bg-emerald-600/25 text-emerald-400',
}

export default function Transfers() {
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchTransfers().then((data) => {
      setTransfers(data)
      setLoading(false)
    })
  }, [])

  const enriched = transfers.map((t) => ({
    ...t,
    date: formatDate(t.date),
    status: (
      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge[t.status] || ''}`}>
        {t.status}
      </span>
    ),
  }))

  const handleSubmit = async (formData) => {
    await submitTransfer(formData)
    setTransfers((prev) => [
      {
        id: `INT-${String(prev.length + 1).padStart(3, '0')}`,
        reference: `IT-2026-${String(prev.length + 11).padStart(4, '0')}`,
        ...formData,
        qty: Number(formData.quantity),
        status: 'Draft',
      },
      ...prev,
    ])
    setToast('Transfer scheduled successfully!')
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <Sidebar />
      <main className="ml-60 pt-16">
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Internal Transfers</h2>
            <p className="text-sm text-gray-400 mt-1">Move stock between warehouses and locations.</p>
          </div>

          {toast && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-400 text-sm font-medium animate-pulse">
              {toast}
            </div>
          )}

          <TransferForm onSubmit={handleSubmit} />

          {loading ? (
            <p className="text-gray-500">Loading transfers…</p>
          ) : (
            <ProductTable columns={columns} data={enriched} caption="Scheduled Transfers" />
          )}
        </div>
      </main>
    </div>
  )
}
