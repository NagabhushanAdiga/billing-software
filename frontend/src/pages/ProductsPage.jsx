import { useState, useEffect, useMemo } from 'react'
import { HiOutlinePlusCircle, HiOutlineCube, HiOutlineSearch, HiOutlineFilter, HiOutlineX } from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import PageHeader from '../components/common/PageHeader'
import ProductSlider from '../components/products/ProductSlider'
import ProductTable from '../components/products/ProductTable'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { useAsyncAction, delay } from '../hooks/useAsyncAction'

function filterProducts(products, { search, groupFilter, batchFilter }) {
  const q = search.trim().toLowerCase()
  return products.filter((p) => {
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.barcode.includes(search.trim())
    const matchGroup = !groupFilter || p.groupId === groupFilter
    const matchBatch = !batchFilter || p.batchId === batchFilter
    return matchSearch && matchGroup && matchBatch
  })
}

export default function ProductsPage() {
  const { products, groups, batches, addProduct, updateProduct, deleteProduct } = useStore()
  const { showToast } = useToast()
  const { loading: deleting, run: runDelete } = useAsyncAction()
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const handleAdd = (data) => {
    const id = addProduct(data)
    if (!id) {
      showToast('Barcode already exists — use a unique barcode', 'error')
      return
    }
    setShowForm(false)
    showToast(`${data.name} added to your inventory`)
  }

  const handleUpdate = (data) => {
    if (editing) {
      const ok = updateProduct(editing.id, data)
      if (!ok) {
        showToast('Barcode already exists — use a unique barcode', 'error')
        return
      }
      setEditing(null)
      showToast(`${data.name} updated successfully`)
    }
  }

  const handleDelete = (product) => {
    setDeleteConfirm(product)
  }

  const confirmDelete = () => {
    if (!deleteConfirm) return
    runDelete(async () => {
      await delay(300)
      deleteProduct(deleteConfirm.id)
      showToast(`${deleteConfirm.name} removed`, 'info')
      setDeleteConfirm(null)
    })
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

  const hasActiveFilters = Boolean(search.trim() || groupFilter || batchFilter)

  const filteredCount = useMemo(
    () => filterProducts(products, { search, groupFilter, batchFilter }).length,
    [products, search, groupFilter, batchFilter]
  )

  const clearFilters = () => {
    setSearch('')
    setGroupFilter('')
    setBatchFilter('')
  }

  return (
    <div className="h-full flex flex-col gap-6 sm:gap-8">
      <PageHeader
        icon={HiOutlineCube}
        iconClassName="from-amber-500 to-orange-600 shadow-amber-600/25"
        title="Products"
        description="Add products with images and stock. Barcodes are generated automatically."
      >
        <Button
          onClick={() => { setShowForm(true); setEditing(null); }}
          className="flex items-center gap-2"
          aria-haspopup="dialog"
          aria-expanded={sliderOpen}
        >
          <HiOutlinePlusCircle className="w-5 h-5" />
          Add product
        </Button>
      </PageHeader>

      <ProductSlider
        open={sliderOpen}
        product={editing}
        onSubmit={editing ? handleUpdate : handleAdd}
        onCancel={() => { setShowForm(false); setEditing(null); }}
      />

      <Card className="p-5 sm:p-6 flex-1 flex flex-col min-h-0">
        <div className="mb-5 shrink-0 rounded-md border border-violet-200 bg-violet-50/30 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <HiOutlineFilter className="w-5 h-5 text-violet-600 shrink-0" />
            <h2 className="text-base font-bold text-slate-900">Search & filter</h2>
            {hasActiveFilters && (
              <span className="text-xs font-semibold text-violet-700 bg-white px-2 py-0.5 rounded-md border border-violet-200">
                Active
              </span>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-violet-700 transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Search"
              type="search"
              icon={HiOutlineSearch}
              placeholder="Name or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div>
              <label htmlFor="product-category-filter" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <select
                id="product-category-filter"
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="field-select"
              >
                <option value="">All categories</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="product-batch-filter" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Batch
              </label>
              <select
                id="product-batch-filter"
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="field-select"
              >
                <option value="">All batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-4">
            Showing <span className="font-semibold text-slate-700">{filteredCount}</span> of{' '}
            <span className="font-semibold text-slate-700">{products.length}</span> products
          </p>
        </div>

        <ProductTable
          products={products}
          onEdit={setEditing}
          onDelete={handleDelete}
          search={search}
          groupFilter={groupFilter || undefined}
          batchFilter={batchFilter || undefined}
        />
      </Card>

      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <Card className="p-6 max-w-sm w-full shadow-2xl">
            <h3 id="delete-dialog-title" className="text-lg font-bold text-slate-900 mb-2">Delete product?</h3>
            <p className="text-slate-500 text-sm mb-5 leading-relaxed">
              &quot;{deleteConfirm.name}&quot; will be removed. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete} loading={deleting}>Delete</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
