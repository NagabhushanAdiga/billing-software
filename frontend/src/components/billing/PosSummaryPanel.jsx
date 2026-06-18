import { useState } from 'react'
import { HiOutlineDocumentText, HiOutlineTrash } from 'react-icons/hi'
import Card from '../common/Card'
import Button from '../common/Button'

export default function PosSummaryPanel({
  itemCount,
  totalQty,
  grossSubtotal,
  discountTotal,
  subtotal,
  tax,
  total,
  taxRate,
  currency,
  discountEnabled,
  onGenerateBill,
  onClearCart,
  billLoading = false,
}) {
  const [confirmClear, setConfirmClear] = useState(false)
  const format = (n) => `${currency}${Number(n).toFixed(2)}`

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    onClearCart()
    setConfirmClear(false)
  }

  return (
    <div className="sticky top-4 space-y-4">
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 text-white p-5 sm:p-6 shadow-xl shadow-fuchsia-500/30 ring-2 ring-white/20">
          <p className="text-fuchsia-100 text-xs font-bold uppercase tracking-wider">Bill total</p>
          <p className="text-3xl sm:text-4xl font-extrabold mt-1 tracking-tight text-white drop-shadow-sm">
            {format(total)}
          </p>
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/25 text-sm">
            <div>
              <p className="text-fuchsia-200 text-xs">Items</p>
              <p className="font-bold text-white mt-0.5">
                {itemCount}{' '}
                <span className="font-normal text-fuchsia-100">({totalQty} units)</span>
              </p>
            </div>
            {discountEnabled && discountTotal > 0 && (
              <div>
                <p className="text-fuchsia-200 text-xs">Saved</p>
                <p className="font-bold text-emerald-200 mt-0.5">−{format(discountTotal)}</p>
              </div>
            )}
            <div>
              <p className="text-fuchsia-200 text-xs">Tax ({taxRate}%)</p>
              <p className="font-bold text-white mt-0.5">{format(tax)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/95 border-2 border-violet-100 p-4 sm:p-5 space-y-2 shadow-lg shadow-violet-100/50 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-800">{format(grossSubtotal)}</span>
          </div>
          {discountEnabled && discountTotal > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Item discounts</span>
              <span className="font-semibold">−{format(discountTotal)}</span>
            </div>
          )}
          {discountEnabled && discountTotal > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>After discount</span>
              <span className="font-semibold text-slate-800">{format(subtotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Tax</span>
            <span className="font-semibold text-slate-800">{format(tax)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-violet-100 font-bold text-slate-900">
            <span>Total</span>
            <span className="text-fuchsia-600">{format(total)}</span>
          </div>
        </div>

        <Button
          type="button"
          className="w-full py-3.5 text-base"
          disabled={itemCount === 0 || billLoading}
          loading={billLoading}
          onClick={onGenerateBill}
        >
          <HiOutlineDocumentText className="w-5 h-5 mr-2 inline" />
          Generate bill
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={itemCount === 0}
          onClick={handleClear}
        >
          <HiOutlineTrash className="w-4 h-4 mr-1.5 inline" />
          {confirmClear ? 'Confirm clear?' : 'Clear bill'}
        </Button>
      </Card>
    </div>
  )
}
