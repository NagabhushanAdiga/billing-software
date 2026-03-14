import { useState, useEffect, useRef } from 'react'
import { HiOutlineUser, HiOutlinePhone } from 'react-icons/hi'
import Button from '../common/Button'
import Card from '../common/Card'

export default function InvoiceCustomerModal({ open, onConfirm, onCancel, totalFormatted }) {
  const [customerName, setCustomerName] = useState('')
  const [customerMobile, setCustomerMobile] = useState('')
  const nameInputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onCancel])

  useEffect(() => {
    if (open && nameInputRef.current) {
      const t = setTimeout(() => nameInputRef.current?.focus(), 100)
      return () => clearTimeout(t)
    }
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!customerName.trim()) return
    onConfirm({ customerName: customerName.trim(), customerMobile: customerMobile.trim() })
    setCustomerName('')
    setCustomerMobile('')
  }

  const handleCancel = () => {
    setCustomerName('')
    setCustomerMobile('')
    onCancel()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Customer details</h3>
        <p className="text-gray-500 text-sm mb-4">Enter customer name and mobile, then click Print bill to open the bill in a new tab for printing.</p>
        {totalFormatted && (
          <p className="text-emerald-600 font-medium text-sm mb-4">Bill total: {totalFormatted}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer name</label>
            <div className="relative">
              <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={nameInputRef}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
                autoComplete="name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile number</label>
            <div className="relative">
              <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                placeholder="Enter mobile number"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">Print bill</Button>
            <Button type="button" variant="secondary" onClick={handleCancel}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
