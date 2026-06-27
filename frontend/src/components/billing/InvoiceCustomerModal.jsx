import { useState, useEffect, useRef } from 'react'
import { HiOutlineUser, HiOutlinePhone } from 'react-icons/hi'
import Button from '../common/Button'
import Card from '../common/Card'
import Input from '../common/Input'
import FormActions from '../common/FormActions'

export default function InvoiceCustomerModal({ open, onConfirm, onCancel, totalFormatted, confirmLoading = false }) {
  const [customerName, setCustomerName] = useState('')
  const [customerMobile, setCustomerMobile] = useState('')
  const mobileInputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onCancel])

  useEffect(() => {
    if (open && mobileInputRef.current) {
      const t = setTimeout(() => mobileInputRef.current?.focus(), 100)
      return () => clearTimeout(t)
    }
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()
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
        <p className="text-slate-500 text-sm mb-4 leading-relaxed">
          Enter mobile (optional name). The bill will open for printing right away.
        </p>
        {totalFormatted && (
          <div className="rounded-md bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 px-4 py-3 mb-5">
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Bill total</p>
            <p className="text-emerald-600 font-extrabold text-xl mt-0.5">{totalFormatted}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            ref={mobileInputRef}
            label="Mobile number"
            type="tel"
            inputMode="numeric"
            icon={HiOutlinePhone}
            value={customerMobile}
            onChange={(e) => setCustomerMobile(e.target.value)}
            placeholder="Enter mobile number"
            autoComplete="tel"
            autoFocus
          />
          <Input
            label="Customer name"
            hint="Optional"
            icon={HiOutlineUser}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter customer name (optional)"
            autoComplete="name"
          />
          <FormActions
            className="pt-2"
            onCancel={handleCancel}
            primaryLabel={confirmLoading ? 'Generating…' : 'Print bill'}
            primaryType="submit"
            loading={confirmLoading}
            disabled={confirmLoading}
          />
        </form>
      </Card>
    </div>
  )
}
