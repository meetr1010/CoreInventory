import { useState } from 'react'
import { createProduct } from '../services/api'

export default function AddProductModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', sku: '', category: '', uom: 'pcs', unit_cost: '', min_stock: ''
  })

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createProduct({
        ...form,
        unit_cost: Number(form.unit_cost) || 0,
        min_stock: Number(form.min_stock) || 0
      })
      onSuccess() // triggers reload
      onClose()
      setForm({ name: '', sku: '', category: '', uom: 'pcs', unit_cost: '', min_stock: '' })
    } catch (err) {
      setError(err.message || 'Failed to create product.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold text-white">Add Product</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Name</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">SKU</label>
              <input required value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Category</label>
              <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">UOM</label>
              <input required value={form.uom} onChange={e => setForm({...form, uom: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Unit Cost</label>
              <input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm({...form, unit_cost: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Min Stock</label>
              <input type="number" value={form.min_stock} onChange={e => setForm({...form, min_stock: e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white" />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
