import { useState } from 'react'
import {
  HiOutlineReceiptRefund,
  HiOutlinePrinter,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineUser,
} from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import PageHeader from '../components/common/PageHeader'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { generateInvoicePdfForPrint } from '../utils/generateInvoicePdf'
import { useAsyncAction, delay } from '../hooks/useAsyncAction'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString() + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function itemCount(order) {
  return (order.items || []).reduce((sum, i) => sum + (i.qty || 0), 0)
}

function BillRow({ order, currency, onReprint, printing }) {
  const [open, setOpen] = useState(false)
  const units = itemCount(order)
  const itemLines = order.items?.length || 0

  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 px-1">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-slate-900 font-bold text-sm">{order.id}</p>
            {order.customerName && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
                <HiOutlineUser className="w-3.5 h-3.5" />
                {order.customerName}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs mt-1">{formatDate(order.date)}</p>
          <p className="text-slate-500 text-xs mt-0.5">
            {itemLines} item{itemLines !== 1 ? 's' : ''} · {units} unit{units !== 1 ? 's' : ''}
            {order.customerMobile ? ` · ${order.customerMobile}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <p className="text-emerald-600 font-extrabold text-lg sm:mr-2">
            {currency}{Number(order.total).toFixed(2)}
          </p>
          <Button
            type="button"
            variant="outline"
            className="!py-2 !px-3 text-sm"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <HiOutlineChevronUp className="w-4 h-4" /> : <HiOutlineChevronDown className="w-4 h-4" />}
            Details
          </Button>
          <Button
            type="button"
            className="!py-2 !px-3 text-sm"
            loading={printing}
            onClick={() => onReprint(order)}
          >
            <HiOutlinePrinter className="w-4 h-4" />
            Reprint
          </Button>
        </div>
      </div>

      {open && (
        <div className="pb-4 px-1">
          <div className="rounded-md bg-slate-50 border border-slate-100 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/80 text-slate-500 text-xs font-bold uppercase">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(order.items || []).map((item, i) => (
                  <tr key={`${item.barcode}-${i}`}>
                    <td className="px-3 py-2 text-slate-800 font-medium">{item.name}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{item.qty}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{currency}{Number(item.price).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900">
                      {currency}{(item.lineTotal ?? item.price * item.qty).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-3 py-2 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
              {order.discountTotal > 0 && (
                <span>Discount: −{currency}{Number(order.discountTotal).toFixed(2)}</span>
              )}
              {order.tax != null && <span>Tax: {currency}{Number(order.tax).toFixed(2)}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RecentlyBilledPage() {
  const { orders, settings } = useStore()
  const { showToast } = useToast()
  const { loading: printing, run } = useAsyncAction()
  const [activeId, setActiveId] = useState(null)
  const currency = settings?.currency || '₹'

  const handleReprint = (order) => {
    setActiveId(order.id)
    run(async () => {
      await delay(300)
      generateInvoicePdfForPrint(settings, order)
      showToast('Bill opened for printing')
      setActiveId(null)
    })
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        icon={HiOutlineReceiptRefund}
        iconClassName="from-cyan-500 to-indigo-600 shadow-cyan-600/25"
        title="Recently billed"
        description="View and reprint bills generated from POS."
      />

      <Card className="p-5 sm:p-6">
        {orders.length === 0 ? (
          <div className="rounded-md border border-dashed border-violet-200 py-16 px-4 text-center bg-violet-50/30">
            <div className="inline-flex w-14 h-14 rounded-md bg-violet-50 items-center justify-center mb-3">
              <HiOutlineReceiptRefund className="w-7 h-7 text-violet-500" />
            </div>
            <p className="text-slate-500 text-sm font-medium">No bills yet.</p>
            <p className="text-slate-400 text-xs mt-1">Bills appear here after you generate them from POS.</p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-bold text-slate-700 mb-2">
              {orders.length} bill{orders.length !== 1 ? 's' : ''}
            </p>
            {orders.map((order) => (
              <BillRow
                key={order.id}
                order={order}
                currency={currency}
                onReprint={handleReprint}
                printing={printing && activeId === order.id}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
