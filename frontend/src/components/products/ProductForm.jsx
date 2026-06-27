import { useState, useEffect } from 'react'
import Button from '../common/Button'
import Input from '../common/Input'
import Card from '../common/Card'
import FormActions from '../common/FormActions'
import ImageField from './ImageField'
import { useStore } from '../../context/StoreContext'
import { isBarcodeTaken, generateUniqueBarcode } from '../../utils/barcode'

const FORM_ID = 'product-form'

export default function ProductForm({
  product,
  onSubmit,
  onCancel,
  inSlider = false,
  formId = FORM_ID,
}) {
  const { groups, batches, products } = useStore()
  const [barcode, setBarcode] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [groupId, setGroupId] = useState('')
  const [batchId, setBatchId] = useState('')
  const [image, setImage] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (product) {
      setBarcode(product.barcode || '')
      setName(product.name || '')
      setPrice(String(product.price ?? ''))
      setStock(String(product.stock ?? ''))
      setGroupId(product.groupId || '')
      setBatchId(product.batchId || '')
      setImage(product.image || '')
    } else {
      setBarcode(generateUniqueBarcode(products))
      setName('')
      setPrice('')
      setStock('')
      setGroupId('')
      setBatchId('')
      setImage('')
    }
    setErrors({})
  }, [product, groups, batches])

  const handleRegenerateBarcode = () => {
    setBarcode(generateUniqueBarcode(products))
    setErrors((er) => ({ ...er, barcode: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const p = parseFloat(price)
    const s = stock === '' ? 0 : parseInt(stock, 10)
    const nextErrors = {}

    let finalBarcode = barcode.trim()
    if (product) {
      if (!finalBarcode) nextErrors.barcode = 'Barcode is required'
      else if (isBarcodeTaken(products, finalBarcode, product.id)) {
        nextErrors.barcode = 'This barcode is already used by another product'
      }
    } else {
      if (!finalBarcode || isBarcodeTaken(products, finalBarcode)) {
        finalBarcode = generateUniqueBarcode(products)
      }
    }

    if (!name.trim()) nextErrors.name = 'Please enter a product name'
    if (isNaN(p) || p < 0) nextErrors.price = 'Please enter a valid price'
    if (stock !== '' && (!Number.isFinite(s) || s < 0)) nextErrors.stock = 'Please enter a valid stock quantity'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
    onSubmit({
      barcode: finalBarcode,
      name: name.trim(),
      price: p,
      stock: stock === '' ? 0 : s,
      groupId: groupId || '',
      batchId: batchId || '',
      image: image || undefined,
    })
  }

  const formFields = (
    <>
      <ImageField image={image} name={name} onChange={setImage} />
      {product ? (
        <Input
          label="Barcode"
          hint="Product barcode used for scanning at POS"
          value={barcode}
          onChange={(e) => { setBarcode(e.target.value); setErrors((er) => ({ ...er, barcode: '' })) }}
          placeholder="e.g. 8901234567890"
          error={errors.barcode}
          required
        />
      ) : (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Barcode</label>
          <p className="text-xs text-slate-400 mb-1.5">Generated automatically — used for POS scanning and label printing</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={barcode}
              readOnly
              inputClassName="!font-mono !bg-slate-50 !text-slate-700"
              className="flex-1 min-w-0"
              aria-label="Auto-generated barcode"
            />
            <Button type="button" variant="outline" onClick={handleRegenerateBarcode} className="shrink-0">
              Regenerate
            </Button>
          </div>
          {errors.barcode && <p className="mt-1.5 text-sm text-red-600">{errors.barcode}</p>}
        </div>
      )}
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
      <Input
        label="Stock quantity"
        hint="Units available in inventory"
        type="number"
        min="0"
        step="1"
        value={stock}
        onChange={(e) => { setStock(e.target.value); setErrors((er) => ({ ...er, stock: '' })) }}
        placeholder="0"
        error={errors.stock}
        required
      />
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Category <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <p className="text-xs text-slate-400 mb-1.5">Organize products — you can skip this and add a category later</p>
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="field-select"
        >
          <option value="">No category</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Batch <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <p className="text-xs text-slate-400 mb-1.5">Link product to a batch — create batches from the Batches page</p>
        <select
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          className="field-select"
        >
          <option value="">No batch</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
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
        <FormActions
          className="pt-2"
          onCancel={onCancel}
          primaryLabel={product ? 'Update' : 'Add product'}
          primaryType="submit"
        />
      </form>
    </Card>
  )
}

export { FORM_ID as PRODUCT_FORM_ID }
