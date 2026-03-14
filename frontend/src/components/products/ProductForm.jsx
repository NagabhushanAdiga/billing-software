import { useState, useEffect } from 'react'
import Button from '../common/Button'
import Input from '../common/Input'
import Card from '../common/Card'

const CATEGORIES = ['Grocery', 'Dairy', 'Personal Care', 'Hardware', 'Other']

export default function ProductForm({ product, onSubmit, onCancel, inSlider }) {
  const [barcode, setBarcode] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Grocery')

  useEffect(() => {
    if (product) {
      setBarcode(product.barcode || '')
      setName(product.name || '')
      setPrice(String(product.price ?? ''))
      setCategory(product.category || 'Grocery')
    } else {
      setBarcode('')
      setName('')
      setPrice('')
      setCategory('Grocery')
    }
  }, [product])

  const handleSubmit = (e) => {
    e.preventDefault()
    const p = parseFloat(price)
    if (!name.trim() || !barcode.trim() || isNaN(p) || p < 0) return
    onSubmit({ barcode: barcode.trim(), name: name.trim(), price: p, category })
  }

  const formContent = (
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
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
          <Button type="submit">{product ? 'Update' : 'Add product'}</Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
  )

  if (inSlider) {
    return formContent
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{product ? 'Edit product' : 'Add product'}</h3>
      {formContent}
    </Card>
  )
}
