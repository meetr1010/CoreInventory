import { useState } from 'react'

const inputClass =
  'w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition'

const WAREHOUSES = ['Main Warehouse', 'East Branch', 'West Branch']

/**
 * TransferForm — Form for scheduling internal stock transfers.
 *
 * Props:
 *   onSubmit(formData) — async callback; receives { product, quantity, from, to, date }
 */
export default function TransferForm({ onSubmit }) {
  const empty = { product: '', quantity: '', from: '', to: '', date: '' }
  const [form, setForm] = useState(empty)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.from === form.to) {
      alert('Source and destination warehouses must be different.')
      return
    }
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
      <h3 className="text-white font-semibold text-lg mb-5">Schedule Transfer</h3>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Product</label>
          <input name="product" value={form.product} onChange={handleChange} required placeholder="e.g. Monitor Stand" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Quantity</label>
          <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} required placeholder="e.g. 10" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">From Warehouse</label>
          <select name="from" value={form.from} onChange={handleChange} required className={inputClass + ' cursor-pointer appearance-none'}>
            <option value="">Select source</option>
            {WAREHOUSES.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">To Warehouse</label>
          <select name="to" value={form.to} onChange={handleChange} required className={inputClass + ' cursor-pointer appearance-none'}>
            <option value="">Select destination</option>
            {WAREHOUSES.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Date</label>
          <input name="date" type="date" value={form.date} onChange={handleChange} required className={inputClass} />
        </div>

        <div className="sm:col-span-2 lg:col-span-5 flex justify-end mt-2">
          <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {submitting ? 'Scheduling…' : 'Schedule Transfer'}
          </button>
        </div>
      </form>
    </div>
  )
}
