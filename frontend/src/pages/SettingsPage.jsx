import { useState, useEffect } from 'react'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import { useStore } from '../context/StoreContext'

const CURRENCIES = [
  { value: '₹', label: 'INR (₹)' },
  { value: '$', label: 'USD ($)' },
  { value: '€', label: 'EUR (€)' },
]

export default function SettingsPage() {
  const { settings, setSettings } = useStore()
  const [storeName, setStoreName] = useState(settings?.storeName ?? '')
  const [taxRate, setTaxRate] = useState(String(settings?.taxRate ?? 5))
  const [currency, setCurrency] = useState(settings?.currency ?? '₹')

  useEffect(() => {
    setStoreName(settings?.storeName ?? '')
    setTaxRate(String(settings?.taxRate ?? 5))
    setCurrency(settings?.currency ?? '₹')
  }, [settings])

  const handleSave = (e) => {
    e.preventDefault()
    const tax = parseFloat(taxRate)
    if (!isNaN(tax) && tax >= 0) {
      setSettings({ storeName: storeName.trim() || 'SuperMart Billing', taxRate: tax, currency })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Store and billing settings</p>
      </div>

      <Card className="p-6 max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Store settings</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Store name"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="SuperMart Billing"
          />
          <Input
            label="Tax rate (%)"
            type="number"
            step="0.01"
            min="0"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            placeholder="5"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <Button type="submit">Save settings</Button>
        </form>
      </Card>
    </div>
  )
}
