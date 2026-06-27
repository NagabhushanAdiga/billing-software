import { useEffect, useMemo, useState } from 'react'
import {
  HiOutlineReceiptRefund,
  HiOutlinePrinter,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineSearch,
} from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import PageHeader from '../components/common/PageHeader'
import TableIdentityCell from '../components/common/TableIdentityCell'
import { useStore } from '../context/StoreContext'
import { useAuth, filterOrdersForUser } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { generateInvoicePdfForPrint } from '../utils/generateInvoicePdf'
import { useAsyncAction, delay } from '../hooks/useAsyncAction'

function formatDateTime(iso) {
  const d = new Date(iso)
  return {
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }),
  }
}

function customerLabel(order) {
  const name = order.customerName?.trim()
  return name || 'Walk-in customer'
}

function itemCount(order) {
  return (order.items || []).reduce((sum, i) => sum + (i.qty || 0), 0)
}

const iconBtnClass =
  'flex items-center justify-center w-9 h-9 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

function BillDetailsDialog({ order, currency, open, onClose, showBilledBy, productByBarcode }) {
  useEffect(() => {
    if (!open) return
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  if (!open || !order) return null

  const units = itemCount(order)
  const { time, date } = formatDateTime(order.date)

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bill-details-title"
      onClick={onClose}
    >
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <Card className="flex flex-col max-h-[85vh] shadow-2xl" showAccent={false}>
          <div className="shrink-0 flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-slate-100">
            <div className="min-w-0">
              <h3 id="bill-details-title" className="text-lg font-bold text-slate-900">
                Bill details
              </h3>
              <p className="text-slate-800 text-sm font-semibold mt-1">{customerLabel(order)}</p>
              <p className="text-slate-500 text-sm mt-0.5 font-mono">{order.id}</p>
              <p className="text-slate-400 text-xs mt-1">{date} · {time}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`${iconBtnClass} text-slate-500 hover:text-slate-800 hover:bg-slate-100 shrink-0`}
              aria-label="Close"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-auto p-5 sm:p-6 space-y-4">
            {(order.customerMobile || (showBilledBy && order.createdBy?.name)) && (
              <div className="rounded-md bg-violet-50/50 border border-violet-100 px-4 py-3 text-sm space-y-1">
                {order.customerMobile && (
                  <p className="text-slate-600">
                    <span className="font-semibold text-slate-800">Mobile:</span> {order.customerMobile}
                  </p>
                )}
                {showBilledBy && order.createdBy?.name && (
                  <p className="text-slate-600">
                    <span className="font-semibold text-slate-800">Billed by:</span> {order.createdBy.name}
                  </p>
                )}
              </div>
            )}

            <div className="rounded-md border border-slate-100 overflow-hidden">
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
                      <td className="px-3 py-2">
                        <TableIdentityCell
                          product={productByBarcode?.get(item.barcode) || { name: item.name, barcode: item.barcode }}
                          title={item.name}
                          subtitle={item.barcode}
                          imageSize="sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">{item.qty}</td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {currency}{Number(item.price).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">
                        {currency}{(item.lineTotal ?? item.price * item.qty).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-md bg-slate-50 border border-slate-100 px-4 py-3 text-sm space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Items</span>
                <span className="font-semibold text-slate-800">
                  {(order.items || []).length} · {units} unit{units !== 1 ? 's' : ''}
                </span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="font-semibold">−{currency}{Number(order.discountTotal).toFixed(2)}</span>
                </div>
              )}
              {order.tax != null && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span className="font-semibold">{currency}{Number(order.tax).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
                <span>Total</span>
                <span className="text-emerald-600">{currency}{Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 p-4 sm:p-5 border-t border-slate-100 flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

function BillRow({ order, currency, onViewDetails, onReprint, printing }) {
  const label = customerLabel(order)
  const { time, date } = formatDateTime(order.date)

  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_100px_110px_88px] items-center gap-3 py-3.5 px-1">
        <TableIdentityCell
          title={label}
          subtitle={order.id}
          name={label}
          avatarFallback="W"
          className="col-span-3 sm:col-span-1"
        />

        <div className="text-left sm:text-right shrink-0">
          <p className="text-slate-900 font-bold text-sm tabular-nums">{time}</p>
          <p className="text-slate-400 text-xs mt-0.5 hidden sm:block">{date}</p>
        </div>

        <p className="text-emerald-600 font-extrabold text-base sm:text-lg text-right tabular-nums shrink-0">
          {currency}{Number(order.total).toFixed(2)}
        </p>

        <div className="flex items-center justify-end gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onViewDetails(order)}
            className={`${iconBtnClass} text-slate-500 hover:text-violet-700 hover:bg-violet-50`}
            title="View details"
            aria-label={`View details for ${order.id}`}
          >
            <HiOutlineEye className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => onReprint(order)}
            disabled={printing}
            className={`${iconBtnClass} text-slate-500 hover:text-sky-700 hover:bg-sky-50`}
            title="Reprint bill"
            aria-label={`Reprint ${order.id}`}
          >
            {printing ? (
              <span className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin-slow" />
            ) : (
              <HiOutlinePrinter className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RecentlyBilledPage() {
  const { orders, settings, products } = useStore()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { loading: printing, run } = useAsyncAction()
  const [activeId, setActiveId] = useState(null)
  const [detailOrder, setDetailOrder] = useState(null)
  const [search, setSearch] = useState('')
  const currency = settings?.currency || '₹'
  const showBilledBy = user?.role === 'admin'

  const visibleOrders = useMemo(
    () => filterOrdersForUser(orders, user),
    [orders, user]
  )

  const productByBarcode = useMemo(() => {
    const map = new Map()
    products.forEach((p) => map.set(p.barcode, p))
    return map
  }, [products])

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return visibleOrders
    return visibleOrders.filter((order) => {
      const name = customerLabel(order).toLowerCase()
      return name.includes(q)
    })
  }, [visibleOrders, search])

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
        description="Search by customer name, view details, or reprint bills."
      />

      <Card className="p-5 sm:p-6">
        {visibleOrders.length === 0 ? (
          <div className="rounded-md border border-dashed border-violet-200 py-16 px-4 text-center bg-violet-50/30">
            <div className="inline-flex w-14 h-14 rounded-md bg-violet-50 items-center justify-center mb-3">
              <HiOutlineReceiptRefund className="w-7 h-7 text-violet-500" />
            </div>
            <p className="text-slate-500 text-sm font-medium">No bills yet.</p>
            <p className="text-slate-400 text-xs mt-1">Bills appear here after you generate them from POS.</p>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <Input
                type="search"
                icon={HiOutlineSearch}
                label="Search customer"
                placeholder="Search by customer name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="hidden sm:grid sm:grid-cols-[1fr_100px_110px_88px] gap-3 px-1 pb-2 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Customer / Bill ID</span>
              <span className="text-right">Time</span>
              <span className="text-right">Total</span>
              <span className="text-right">Actions</span>
            </div>

            <p className="text-sm font-bold text-slate-700 mb-2 sm:mb-0 sm:py-3">
              {filteredOrders.length} of {visibleOrders.length} bill{visibleOrders.length !== 1 ? 's' : ''}
              {search.trim() ? ` matching "${search.trim()}"` : ''}
            </p>

            {filteredOrders.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-12 border border-dashed border-slate-200 rounded-md">
                No bills match this customer name.
              </p>
            ) : (
              filteredOrders.map((order) => (
                <BillRow
                  key={order.id}
                  order={order}
                  currency={currency}
                  onViewDetails={setDetailOrder}
                  onReprint={handleReprint}
                  printing={printing && activeId === order.id}
                />
              ))
            )}
          </div>
        )}
      </Card>

      <BillDetailsDialog
        order={detailOrder}
        currency={currency}
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        showBilledBy={showBilledBy}
        productByBarcode={productByBarcode}
      />
    </div>
  )
}
