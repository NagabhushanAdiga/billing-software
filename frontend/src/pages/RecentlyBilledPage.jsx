import { useMemo, useState } from 'react'
import {
  HiOutlineReceiptRefund,
  HiOutlinePrinter,
  HiOutlineEye,
  HiOutlineSearch,
} from 'react-icons/hi'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import Pagination from '../components/common/Pagination'
import TableIdentityCell from '../components/common/TableIdentityCell'
import ReceiptBillModal from '../components/billing/ReceiptBillModal'
import { useStore } from '../context/StoreContext'
import { useAuth, filterOrdersForUser } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePagination } from '../hooks/usePagination'
import { generateInvoicePdfForPrint } from '../utils/generateInvoicePdf'

function formatDateTime(iso) {
  const d = new Date(iso)
  return {
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }),
  }
}

function customerLabel(order) {
  const name = order.customerName?.trim()
  const mobile = order.customerMobile?.trim()
  if (name) return name
  if (mobile) return mobile
  return 'Walk-in customer'
}

const iconBtnClass =
  'flex items-center justify-center w-9 h-9 rounded-md transition-colors cursor-pointer'

function BillRow({ order, currency, onViewDetails, onReprint, printing }) {
  const label = customerLabel(order)
  const { time, date } = formatDateTime(order.date)

  return (
    <div className="border-b border-slate-300">
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
            title="View invoice"
            aria-label={`View invoice ${order.id}`}
          >
            <HiOutlineEye className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => onReprint(order)}
            disabled={printing}
            className={`${iconBtnClass} text-slate-500 hover:text-sky-700 hover:bg-sky-50 disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Print invoice"
            aria-label={`Print ${order.id}`}
          >
            <HiOutlinePrinter className={`w-5 h-5 ${printing ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RecentlyBilledPage() {
  const { orders, settings } = useStore()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [detailOrder, setDetailOrder] = useState(null)
  const [printingId, setPrintingId] = useState(null)
  const [search, setSearch] = useState('')
  const currency = settings?.currency || '₹'

  const visibleOrders = useMemo(
    () => filterOrdersForUser(orders, user),
    [orders, user]
  )

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return visibleOrders
    return visibleOrders.filter((order) => {
      const name = customerLabel(order).toLowerCase()
      const mobile = String(order.customerMobile || '').trim().toLowerCase()
      const billId = String(order.id || '').toLowerCase()
      return name.includes(q) || mobile.includes(q) || billId.includes(q)
    })
  }, [visibleOrders, search])

  const {
    paginatedItems,
    page,
    setPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filteredOrders, { resetDeps: [search] })

  const closeInvoice = () => {
    setDetailOrder(null)
  }

  const handlePreview = (order) => {
    setDetailOrder(order)
  }

  const handlePrint = async (order) => {
    if (printingId) return
    setPrintingId(order.id)
    try {
      await generateInvoicePdfForPrint(settings, order)
      showToast('Print dialog opened')
    } catch {
      showToast('Could not print bill', 'error')
    } finally {
      setPrintingId(null)
    }
  }

  return (
    <div className="h-full max-h-full flex flex-col min-h-0 overflow-hidden">
      <Card className="p-3 sm:p-4 flex-1 flex flex-col min-h-0 gap-3 overflow-hidden">
        {visibleOrders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center rounded-md border border-dashed border-violet-200 py-16 px-4 text-center bg-violet-50/30">
            <div>
              <div className="inline-flex w-14 h-14 rounded-md bg-violet-50 items-center justify-center mb-3">
                <HiOutlineReceiptRefund className="w-7 h-7 text-violet-500" />
              </div>
              <p className="text-slate-500 text-sm font-medium">No bills yet.</p>
              <p className="text-slate-400 text-xs mt-1">Bills appear here after you generate them from POS.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="shrink-0">
              <Input
                type="search"
                icon={HiOutlineSearch}
                placeholder="Search by name, mobile, or bill ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="hidden sm:grid shrink-0 sm:grid-cols-[1fr_100px_110px_88px] gap-3 px-1 pb-2 border-b border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Customer / Bill ID</span>
              <span className="text-right">Time</span>
              <span className="text-right">Total</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              {filteredOrders.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-slate-500 text-sm text-center py-12 border border-dashed border-slate-200 rounded-md px-6">
                    No bills match this search.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-h-0 overflow-auto -mx-1 px-1">
                    {paginatedItems.map((order) => (
                      <BillRow
                        key={order.id}
                        order={order}
                        currency={currency}
                        onViewDetails={handlePreview}
                        onReprint={handlePrint}
                        printing={printingId === order.id}
                      />
                    ))}
                  </div>
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    onPageChange={setPage}
                    className="shrink-0 !mt-3 bg-white"
                  />
                </>
              )}
            </div>
          </>
        )}
      </Card>

      <ReceiptBillModal
        open={!!detailOrder}
        order={detailOrder}
        settings={settings}
        onClose={closeInvoice}
      />
    </div>
  )
}
