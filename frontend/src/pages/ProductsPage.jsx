import { useState, useEffect } from 'react'
import { HiOutlinePlusCircle } from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import ProductSlider from '../components/products/ProductSlider'
import ProductTable from '../components/products/ProductTable'
import { useStore } from '../context/StoreContext'

const CATEGORIES = ['', 'Grocery', 'Dairy', 'Personal Care', 'Hardware', 'Other']

export default function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const handleAdd = (data) => {
    addProduct(data)
    setShowForm(false)
  }

  const handleUpdate = (data) => {
    if (editing) {
      updateProduct(editing.id, data)
      setEditing(null)
    }
  }

  const handleDelete = (product) => {
    setDeleteConfirm(product)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteProduct(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }

  useEffect(() => {
    if (!deleteConfirm) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') setDeleteConfirm(null)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [deleteConfirm])

  const sliderOpen = showForm || !!editing

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">Manage products and barcodes</p>
        </div>
        <Button
          onClick={() => { setShowForm(true); setEditing(null); }}
          className="flex items-center gap-2"
          aria-haspopup="dialog"
          aria-expanded={sliderOpen}
        >
          <HiOutlinePlusCircle className="w-5 h-5" />
          Add product
        </Button>
      </div>

      <ProductSlider
        open={sliderOpen}
        product={editing}
        onSubmit={editing ? handleUpdate : handleAdd}
        onCancel={() => { setShowForm(false); setEditing(null); }}
      />

      <Card className="p-4 md:p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Search & filter</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="search"
              placeholder="Search by name or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c || 'all'} value={c}>{c || 'All categories'}</option>
              ))}
            </select>
          </div>
        </div>
        <ProductTable
          products={products}
          onEdit={setEditing}
          onDelete={handleDelete}
          search={search}
          categoryFilter={categoryFilter || undefined}
        />
      </Card>

      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <Card className="p-6 max-w-sm w-full">
            <h3 id="delete-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">Delete product?</h3>
            <p className="text-gray-600 text-sm mb-4">
              &quot;{deleteConfirm.name}&quot; will be removed. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete}>Delete</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
