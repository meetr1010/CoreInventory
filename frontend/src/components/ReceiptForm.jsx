import { useState } from 'react'

const inputClass =
  'w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition'

/**
 * ReceiptForm — Reusable form for receiving stock.
 *
 * Props:
 *   onSubmit(formData) — async callback; receives { product, quantity, supplier, date }
 */
export default function ReceiptForm({ onSubmit }) {
  const empty = { product: '', quantity: '', supplier: '', date: '' }
  const [form, setForm] = useState(empty)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(form)
      setForm(empty)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 mb-8">
      <h3 className="text-white font-semibold text-lg mb-5">Receive Stock</h3>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Product Name</label>
          <input name="product" value={form.product} onChange={handleChange} required placeholder="e.g. Wireless Mouse" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Quantity</label>
          <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} required placeholder="e.g. 50" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Supplier</label>
          <input name="supplier" value={form.supplier} onChange={handleChange} required placeholder="e.g. TechWorld Ltd." className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Date</label>
          <input name="date" type="date" value={form.date} onChange={handleChange} required className={inputClass} />
        </div>

        <div className="sm:col-span-2 lg:col-span-4 flex justify-end mt-2">
          <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {submitting ? 'Saving…' : 'Save Receipt'}
          </button>
        </div>
      </form>
    </div>
  )
}
