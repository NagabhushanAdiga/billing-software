import Button from '../common/Button'

export default function CartItem({ item, onQtyChange, onRemove, currency = '₹' }) {
  const { name, price, qty, barcode } = item

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-gray-900 font-medium truncate">{name}</p>
        <p className="text-gray-500 text-sm">{barcode || '—'}</p>
      </div>
      <div className="flex items-center gap-2 mx-3">
        <button
          type="button"
          onClick={() => onQtyChange(item, -1)}
          className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center justify-center text-lg leading-none font-medium"
        >
          −
        </button>
        <span className="w-8 text-center text-gray-900 font-medium">{qty}</span>
        <button
          type="button"
          onClick={() => onQtyChange(item, 1)}
          className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center justify-center text-lg leading-none font-medium"
        >
          +
        </button>
      </div>
      <div className="text-right min-w-[80px]">
        <p className="text-emerald-600 font-medium">{currency}{(price * qty).toFixed(2)}</p>
        <Button variant="ghost" className="!p-1 !text-xs text-red-500 hover:text-red-600" onClick={() => onRemove(item)}>
          Remove
        </Button>
      </div>
    </div>
  )
}
