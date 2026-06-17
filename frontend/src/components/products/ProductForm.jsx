import { useState, useEffect } from 'react'
import Button from '../common/Button'
import Input from '../common/Input'
import Card from '../common/Card'
import ImageField from './ImageField'
import { useStore } from '../../context/StoreContext'

const FORM_ID = 'product-form'

export default function ProductForm({
  product,
  onSubmit,
  onCancel,
  inSlider = false,
  formId = FORM_ID,
}) {
  const { groups } = useStore()
  const [barcode, setBarcode] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [groupId, setGroupId] = useState('')
  const [image, setImage] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (product) {
      setBarcode(product.barcode || '')
      setName(product.name || '')
      setPrice(String(product.price ?? ''))
      setGroupId(product.groupId || '')
      setImage(product.image || '')
    } else {
      setBarcode('')
      setName('')
      setPrice('')
      setGroupId('')
      setImage('')
    }
    setErrors({})
  }, [product, groups])

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
    setErrors({})
    onSubmit({
      barcode: barcode.trim(),
      name: name.trim(),
      price: p,
      groupId: groupId || '',
      image: image || undefined,
    })
  }

  const formFields = (
    <>
      <ImageField image={image} name={name} onChange={setImage} />
      <Input
        label="Barcode"
        hint="Scan or type the product barcode number"
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
        <p className="text-xs text-slate-400 mb-1.5">Organize products — you can skip this and add a group later</p>
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
    </>
  )

  if (inSlider) {
    return (
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {formFields}
      </form>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{product ? 'Edit product' : 'Add product'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formFields}
        <div className="flex gap-2 pt-2">
          <Button type="submit">{product ? 'Update' : 'Add product'}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}

export { FORM_ID as PRODUCT_FORM_ID }
