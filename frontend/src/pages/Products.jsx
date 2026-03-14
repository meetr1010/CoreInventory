import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import ProductTable from '../components/ProductTable'
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
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts().then((data) => {
      // Enrich rows with formatted values
      const enriched = data.map((p) => ({
        ...p,
        price: formatCurrency(p.price),
        status: (
          <span className={`font-medium ${statusColor(p.status)}`}>
            {p.status}
          </span>
        ),
      }))
      setProducts(enriched)
      setLoading(false)
    })
  }, [])

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
              <p className="text-sm text-gray-400 mt-1">
                Manage your full product catalog.
              </p>
            </div>
            <button className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
              + Add Product
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-gray-500">Loading products…</p>
          ) : (
            <ProductTable
              columns={columns}
              data={products}
              caption="Product Inventory"
            />
          )}
        </div>
      </main>
    </div>
  )
}
