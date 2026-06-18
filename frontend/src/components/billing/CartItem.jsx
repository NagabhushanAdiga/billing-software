import { HiOutlineTrash } from 'react-icons/hi'
import ProductImage from '../common/ProductImage'
import { lineGross, lineNet, lineDiscountAmount } from '../../utils/billing'

const INDEX_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-fuchsia-100 text-fuchsia-700',
  'bg-amber-100 text-amber-700',
]

export default function CartItem({
  item,
  onQtyChange,
  onRemove,
  currency = '₹',
  index,
  discountEnabled = false,
  discountType = 'percent',
  editableDiscount = false,
}) {
  const { name, price, qty, barcode, discount = 0 } = item
  const gross = lineGross(item)
  const discountAmt = lineDiscountAmount(item, discountType)
  const net = lineNet(item, discountType)
  const hasDiscount = discountAmt > 0

  const discountLabel = discountType === 'percent' ? '%' : currency

  return (
    <div className="py-3 px-3 rounded-xl border border-transparent hover:border-violet-200 hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-fuchsia-50/30 transition-all group">
      <div className="flex items-center gap-3">
        <span className={`hidden sm:flex w-6 h-6 rounded-lg text-xs font-bold items-center justify-center shrink-0 ${INDEX_COLORS[(index - 1) % INDEX_COLORS.length]}`}>
          {index}
        </span>
        <ProductImage product={item} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-slate-900 font-semibold truncate text-sm">{name}</p>
          <p className="text-slate-400 text-xs mt-0.5">
            {currency}{Number(price).toFixed(2)} each
            <span className="mx-1.5 text-slate-300">·</span>
            <span className="font-mono">{barcode || '—'}</span>
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gradient-to-r from-violet-100 to-fuchsia-100 rounded-xl p-1 shrink-0 border border-violet-200/60">
          <button
            type="button"
            onClick={() => onQtyChange(item, -1)}
            aria-label="Decrease quantity"
            className="w-8 h-8 rounded-md bg-white text-violet-700 hover:bg-violet-50 flex items-center justify-center text-lg font-bold shadow-sm transition-colors"
          >
            −
          </button>
          <span className="w-8 text-center text-violet-900 font-bold text-sm">{qty}</span>
          <button
            type="button"
            onClick={() => onQtyChange(item, 1)}
            aria-label="Increase quantity"
            className="w-8 h-8 rounded-md bg-white text-violet-700 hover:bg-fuchsia-50 flex items-center justify-center text-lg font-bold shadow-sm transition-colors"
          >
            +
          </button>
        </div>
        <div className="text-right min-w-[76px] shrink-0">
          {hasDiscount ? (
            <>
              <p className="text-slate-400 text-xs line-through">{currency}{gross.toFixed(2)}</p>
              <p className="text-fuchsia-600 font-bold text-sm">{currency}{net.toFixed(2)}</p>
            </>
          ) : (
            <p className="text-fuchsia-600 font-bold text-sm">{currency}{gross.toFixed(2)}</p>
          )}
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="inline-flex items-center gap-0.5 mt-1 text-[11px] font-medium text-red-400 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          >
            <HiOutlineTrash className="w-3.5 h-3.5" />
            Remove
          </button>
        </div>
      </div>

      {discountEnabled && hasDiscount && (
        <div className="mt-2.5 ml-0 sm:ml-[4.25rem] flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-violet-700 shrink-0">Discount:</span>
          <span className="text-xs font-semibold text-violet-700">
            {Number(discount)}{discountLabel}
          </span>
          <span className="text-xs font-semibold text-emerald-600">
            −{currency}{discountAmt.toFixed(2)} off
          </span>
          {!editableDiscount && (
            <span className="text-[11px] text-slate-400">
              (set in Settings)
            </span>
          )}
        </div>
      )}
    </div>
  )
}
