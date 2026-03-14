import Button from '../common/Button'
import CartItem from './CartItem'

export default function CartSummary({
  items,
  onQtyChange,
  onRemove,
  onGenerateInvoice,
  taxRate = 5,
  currency = '₹',
}) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax
  const format = (n) => `${currency}${n.toFixed(2)}`

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-auto">
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No items in bill. Scan or add items.</p>
        ) : (
          items.map((item) => (
            <CartItem
              key={item.barcode + (item.id || '')}
              item={item}
              onQtyChange={onQtyChange}
              onRemove={onRemove}
              currency={currency}
            />
          ))
        )}
      </div>
      <div className="shrink-0 border-t border-gray-200 pt-4 mt-4 space-y-2">
        <div className="flex justify-between text-gray-600 text-sm">
          <span>Subtotal</span>
          <span>{format(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600 text-sm">
          <span>Tax ({taxRate}%)</span>
          <span>{format(tax)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
          <span>Total</span>
          <span className="text-emerald-600">{format(total)}</span>
        </div>
        <Button
          className="w-full mt-4"
          onClick={onGenerateInvoice}
          disabled={items.length === 0}
        >
          Generate bill
        </Button>
      </div>
    </div>
  )
}
