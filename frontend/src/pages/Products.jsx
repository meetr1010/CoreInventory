import { useEffect, useState, useMemo } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import ProductTable from '../components/ProductTable'
import AddProductModal from '../components/AddProductModal'
import { fetchProducts } from '../services/api'
import { formatCurrency, statusColor } from '../utils/helpers'

const columns = [
  { key: 'name',     label: 'Product' },
  { key: 'sku',      label: 'SKU' },
  { key: 'category', label: 'Category' },
  { key: 'stock',    label: 'Stock' },
  { key: 'price',    label: 'Price' },
  { key: 'status',   label: 'Status' },
]

export default function Products() {
  const [allProducts, setAllProducts] = useState([])   // raw data
  const [loading, setLoading]         = useState(true)
  const [isModalOpen, setModalOpen]   = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [search, setSearch]           = useState('')

  const loadProducts = () => {
    setLoading(true)
    fetchProducts().then((data) => {
      setAllProducts(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadProducts() }, [])

  // Derive unique category list from real data
  const categories = useMemo(() => {
    const cats = [...new Set(allProducts.map(p => p.category).filter(c => c && c !== '—'))]
    return ['All', ...cats.sort()]
  }, [allProducts])

  // Filter + enrich products for display
  const displayProducts = useMemo(() => {
    let filtered = allProducts
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(p => p.category === categoryFilter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      )
    }
    return filtered.map(p => ({
      ...p,
      price:  formatCurrency(p.price),
      status: <span className={`font-medium ${statusColor(p.status)}`}>{p.status}</span>,
    }))
  }, [allProducts, categoryFilter, search])

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <Sidebar />

      <main className="ml-60 pt-16">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Products</h2>
              <p className="text-sm text-gray-400 mt-1">Manage your full product catalog.</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              + Add Product
            </button>
          </div>

          {/* Filters */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[180px]">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Search</label>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Name or SKU…"
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category filter */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Category</label>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Clear filters */}
              {(categoryFilter !== 'All' || search) && (
                <div className="self-end">
                  <button
                    onClick={() => { setCategoryFilter('All'); setSearch('') }}
                    className="px-3 py-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              )}

              {/* Result count */}
              <div className="self-end ml-auto text-xs text-gray-500">
                {displayProducts.length} of {allProducts.length} products
              </div>
            </div>
          </div>

          <AddProductModal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            onSuccess={loadProducts}
          />

          {/* Table */}
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500 py-8">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Loading products…
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-3xl mb-2">📦</p>
              <p>No products found{categoryFilter !== 'All' ? ` in category "${categoryFilter}"` : ''}.</p>
              {(categoryFilter !== 'All' || search) && (
                <button onClick={() => { setCategoryFilter('All'); setSearch('') }} className="mt-3 text-indigo-400 text-sm underline">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <ProductTable
              columns={columns}
              data={displayProducts}
              caption={`Products${categoryFilter !== 'All' ? ` — ${categoryFilter}` : ''} (${displayProducts.length})`}
            />
          )}
        </div>
      </main>
    </div>
  )
}
