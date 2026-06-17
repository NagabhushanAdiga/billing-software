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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="p-6 sm:p-8 max-w-md w-full shadow-2xl">
        <h3 className="text-xl font-bold text-slate-900 mb-1">Customer details</h3>
        <p className="text-slate-500 text-sm mb-4 leading-relaxed">Enter customer info, then print the bill.</p>
        {totalFormatted && (
          <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 px-4 py-3 mb-5">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Bill total</p>
            <p className="text-emerald-600 font-extrabold text-xl mt-0.5">{totalFormatted}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Customer name</label>
            <div className="relative">
              <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                ref={nameInputRef}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                className="field-input pl-11"
                required
                autoComplete="name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile number</label>
            <div className="relative">
              <HiOutlinePhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="tel"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                placeholder="Enter mobile number"
                className="field-input pl-11"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">Print bill</Button>
            <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
