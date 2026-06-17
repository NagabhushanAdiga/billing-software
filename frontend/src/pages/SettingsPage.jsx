import { useMemo, useState, useEffect } from 'react'
import { HiOutlineCog } from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import PageHeader from '../components/common/PageHeader'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'

const CURRENCIES = [
  { value: '₹', label: 'INR (₹)' },
  { value: '$', label: 'USD ($)' },
  { value: '€', label: 'EUR (€)' },
]

export default function SettingsPage() {
  const { settings, setSettings, products, updateProduct } = useStore()
  const { showToast } = useToast()
  const [storeName, setStoreName] = useState(settings?.storeName ?? '')
  const [taxRate, setTaxRate] = useState(String(settings?.taxRate ?? 5))
  const [currency, setCurrency] = useState(settings?.currency ?? '₹')
  const [discountEnabled, setDiscountEnabled] = useState(settings?.discountEnabled ?? true)
  const [discountType, setDiscountType] = useState(settings?.discountType ?? 'percent')
  const [maxDiscountPercent, setMaxDiscountPercent] = useState(String(settings?.maxDiscountPercent ?? 50))
  const [selectedProductId, setSelectedProductId] = useState('')
  const [productDiscount, setProductDiscount] = useState('')

  useEffect(() => {
    setStoreName(settings?.storeName ?? '')
    setTaxRate(String(settings?.taxRate ?? 5))
    setCurrency(settings?.currency ?? '₹')
    setDiscountEnabled(settings?.discountEnabled ?? true)
    setDiscountType(settings?.discountType ?? 'percent')
    setMaxDiscountPercent(String(settings?.maxDiscountPercent ?? 50))
  }, [settings])

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  )

  useEffect(() => {
    if (!selectedProduct) {
      setProductDiscount('')
      return
    }
    setProductDiscount(String(selectedProduct.discount || 0))
  }, [selectedProduct])

  const handleSave = (e) => {
    e.preventDefault()
    const tax = parseFloat(taxRate)
    if (isNaN(tax) || tax < 0) {
      showToast('Please enter a valid tax rate', 'error')
      return
    }
    const maxPct = parseFloat(maxDiscountPercent)
    if (discountType === 'percent' && (isNaN(maxPct) || maxPct < 0 || maxPct > 100)) {
      showToast('Max discount must be between 0 and 100', 'error')
      return
    }
    setSettings({
      storeName: storeName.trim() || 'SuperMart Billing',
      taxRate: tax,
      currency,
      discountEnabled,
      discountType,
      maxDiscountPercent: discountType === 'percent' ? maxPct : settings?.maxDiscountPercent ?? 50,
    })
    showToast('Settings saved successfully')
  }

  const handleApplyProductDiscount = (e) => {
    e.preventDefault()
    if (!selectedProductId) {
      showToast('Please select a product', 'error')
      return
    }
    const val = parseFloat(productDiscount)
    if (isNaN(val) || val < 0) {
      showToast('Please enter a valid discount value', 'error')
      return
    }
    if (discountType === 'percent' && val > 100) {
      showToast('Percentage discount cannot exceed 100', 'error')
      return
    }
    updateProduct(selectedProductId, { discount: val })
    showToast('Product discount updated')
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        icon={HiOutlineCog}
        iconClassName="from-slate-600 to-slate-800 shadow-slate-600/25"
        title="Settings"
        description="Customize store details, tax, currency, and per-item discounts on POS."
      />

      <Card className="p-6 sm:p-8 max-w-2xl">
        <h2 className="text-base font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent mb-5">Store details</h2>
        <form onSubmit={handleSave} className="space-y-5">
          <Input
            label="Store name"
            hint="Shown on the header and printed bills"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="SuperMart Billing"
          />
          <Input
            label="Tax rate (%)"
            hint="Applied on the discounted subtotal of each bill"
            type="number"
            step="0.01"
            min="0"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            placeholder="5"
          />
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Currency</label>
            <p className="text-xs text-slate-400 mb-1.5">Used across POS, products, and reports</p>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="field-select"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-violet-100">
            <h3 className="text-sm font-bold text-violet-800 mb-1">Item discounts (POS)</h3>
            <p className="text-xs text-slate-500 mb-4">Set discount type once, then assign discounts for specific products below.</p>

            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={discountEnabled}
                onChange={(e) => setDiscountEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-sm font-semibold text-slate-700">Enable per-item discounts on POS</span>
            </label>

            {discountEnabled && (
              <div className="space-y-4 pl-1">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Discount type</label>
                  <p className="text-xs text-slate-400 mb-1.5">How product discount values are interpreted</p>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="field-select"
                  >
                    <option value="percent">Percentage off line total (%)</option>
                    <option value="amount">Flat amount off line ({currency})</option>
                  </select>
                </div>

                {discountType === 'percent' && (
                  <Input
                    label="Maximum discount (%)"
                    hint="Applied to product-level discounts in percent mode"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={maxDiscountPercent}
                    onChange={(e) => setMaxDiscountPercent(e.target.value)}
                    placeholder="50"
                  />
                )}
              </div>
            )}
          </div>

          {discountEnabled && (
            <div className="pt-4 border-t border-violet-100 space-y-3">
              <h3 className="text-sm font-bold text-violet-800">Product specific discount</h3>
              <p className="text-xs text-slate-500">
                Select a product and set its default discount for POS.
              </p>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="field-select"
                >
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.barcode})
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label={`Discount value (${discountType === 'percent' ? '%' : currency})`}
                type="number"
                min="0"
                max={discountType === 'percent' ? '100' : undefined}
                step={discountType === 'percent' ? '1' : '0.01'}
                value={productDiscount}
                onChange={(e) => setProductDiscount(e.target.value)}
                placeholder="0"
              />
              <Button type="button" variant="outline" onClick={handleApplyProductDiscount}>
                Apply product discount
              </Button>
            </div>
          )}

          <Button type="submit">Save changes</Button>
        </form>
      </Card>
    </div>
  )
}
