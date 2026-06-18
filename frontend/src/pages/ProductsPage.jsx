import { useState, useEffect } from 'react'
import { HiOutlinePlusCircle, HiOutlineCube, HiOutlineSearch } from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import PageHeader from '../components/common/PageHeader'
import ProductSlider from '../components/products/ProductSlider'
import ProductTable from '../components/products/ProductTable'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { useAsyncAction, delay } from '../hooks/useAsyncAction'

export default function ProductsPage() {
  const { products, groups, addProduct, updateProduct, deleteProduct } = useStore()
  const { showToast } = useToast()
  const { loading: deleting, run: runDelete } = useAsyncAction()
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const handleAdd = (data) => {
    addProduct(data)
    setShowForm(false)
    showToast(`${data.name} added to your inventory`)
  }

  const handleUpdate = (data) => {
    if (editing) {
      updateProduct(editing.id, data)
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

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        icon={HiOutlineCube}
        iconClassName="from-amber-500 to-orange-600 shadow-amber-600/25"
        title="Products"
        description="Add products with barcodes and images. Groups are optional."
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

      <Card className="p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Search & filter</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="search"
              icon={HiOutlineSearch}
              placeholder="Search by name or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0"
            />
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="field-select w-full sm:w-auto sm:min-w-[180px]"
            >
              <option value="">All groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
        <ProductTable
          products={products}
          onEdit={setEditing}
          onDelete={handleDelete}
          search={search}
          groupFilter={groupFilter || undefined}
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
