import { useState, useEffect } from 'react'
import Button from '../common/Button'
import Input from '../common/Input'

const CATEGORIES = ['Grocery', 'Dairy', 'Personal Care', 'Hardware', 'Other']

export default function AddProductModal({ open, initialBarcode = '', onAdd, onCancel }) {
  const [barcode, setBarcode] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Grocery')

  useEffect(() => {
    if (open) {
      setBarcode(initialBarcode)
      setName('')
      setPrice('')
      setCategory('Grocery')
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
    if (!name.trim() || !barcode.trim() || isNaN(p) || p < 0) return
    onAdd({ barcode: barcode.trim(), name: name.trim(), price: p, category })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ease-out ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCancel}
        aria-hidden="true"
      />
      {/* Slider panel - right to left */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Add product manually</h3>
            <p className="text-gray-500 text-sm mt-0.5">Add product and it will be added to the bill.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Close (Escape)"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="e.g. 8901234567890"
              required
            />
            <Input
              label="Product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rice 1kg"
              required
            />
            <Input
              label="Price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1">Add to bill</Button>
              <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
