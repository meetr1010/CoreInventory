import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import ProductTable from '../components/ProductTable'
import ReceiptForm from '../components/ReceiptForm'
import { submitReceipt, fetchRecentReceipts } from '../services/api'
import { formatDate } from '../utils/helpers'

const receiptColumns = [
  { key: 'product',  label: 'Product' },
  { key: 'quantity', label: 'Qty' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'date',     label: 'Date' },
]

export default function Receipts() {
  const [receipts, setReceipts] = useState([])
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchRecentReceipts().then((data) =>
      setReceipts(data.map((r) => ({ ...r, date: formatDate(r.date) }))),
    )
  }, [])

  const handleSubmit = async (formData) => {
    await submitReceipt(formData)
    setReceipts((prev) => [
      {
        id: Date.now(),
        ...formData,
        quantity: Number(formData.quantity),
        date: formatDate(formData.date),
      },
      ...prev,
    ])
    setToast('Stock receipt saved successfully!')
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <Sidebar />

      <main className="ml-60 pt-16">
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Receipts</h2>
            <p className="text-sm text-gray-400 mt-1">
              Receive new stock and view recent incoming transactions.
            </p>
          </div>

          {toast && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium animate-pulse">
              {toast}
            </div>
          )}

          <ReceiptForm onSubmit={handleSubmit} />

          <ProductTable
            columns={receiptColumns}
            data={receipts}
            caption="Recent Incoming Transactions"
          />
        </div>
      </main>
    </div>
  )
}
