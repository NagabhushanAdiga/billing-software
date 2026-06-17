import { useState, useEffect } from 'react'
import Button from '../common/Button'
import Input from '../common/Input'
import ImageField from '../products/ImageField'
import { useStore } from '../../context/StoreContext'

const POS_PRODUCT_FORM_ID = 'pos-add-product-form'

export default function AddProductModal({ open, initialBarcode = '', onAdd, onCancel }) {
  const { groups } = useStore()
  const [barcode, setBarcode] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [groupId, setGroupId] = useState('')
  const [image, setImage] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setBarcode(initialBarcode)
      setName('')
      setPrice('')
      setGroupId('')
      setImage('')
      setErrors({})
    }
  }, [open, initialBarcode])

  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onCancel])

  const handleSubmit = (e) => {
    e.preventDefault()
    const p = parseFloat(price)
    const nextErrors = {}
    if (!barcode.trim()) nextErrors.barcode = 'Please enter a barcode'
    if (!name.trim()) nextErrors.name = 'Please enter a product name'
    if (isNaN(p) || p < 0) nextErrors.price = 'Please enter a valid price'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    onAdd({
      barcode: barcode.trim(),
      name: name.trim(),
      price: p,
      groupId: groupId || '',
      image: image || undefined,
    })
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-out ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 right-0 h-full w-full sm:max-w-md bg-white border-l border-slate-200/80 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Add new product</h3>
            <p className="text-slate-500 text-sm mt-0.5">Saved to inventory and added to this bill.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
            aria-label="Close (Escape)"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-5 sm:p-6">
          <form id={POS_PRODUCT_FORM_ID} onSubmit={handleSubmit} className="space-y-4">
            <ImageField image={image} name={name} onChange={setImage} />
            <Input
              label="Barcode"
              value={barcode}
              onChange={(e) => { setBarcode(e.target.value); setErrors((er) => ({ ...er, barcode: '' })) }}
              placeholder="e.g. 8901234567890"
              error={errors.barcode}
              required
            />
            <Input
              label="Product name"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((er) => ({ ...er, name: '' })) }}
              placeholder="e.g. Rice 1kg"
              error={errors.name}
              required
            />
            <Input
              label="Price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => { setPrice(e.target.value); setErrors((er) => ({ ...er, price: '' })) }}
              placeholder="0.00"
              error={errors.price}
              required
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Group <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="field-select"
              >
                <option value="">No group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </form>
        </div>

        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-200 bg-white flex gap-2 shadow-[0_-4px_24px_rgba(15,23,42,0.06)]">
          <Button type="submit" form={POS_PRODUCT_FORM_ID} className="flex-1">
            Save & add to bill
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  )
}
