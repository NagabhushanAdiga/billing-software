import ProductImage from '../common/ProductImage'

const CARD_ACCENTS = [
  'hover:border-emerald-400 hover:bg-gradient-to-b hover:from-emerald-50 hover:to-white hover:shadow-emerald-200/50',
  'hover:border-sky-400 hover:bg-gradient-to-b hover:from-sky-50 hover:to-white hover:shadow-sky-200/50',
  'hover:border-violet-400 hover:bg-gradient-to-b hover:from-violet-50 hover:to-white hover:shadow-violet-200/50',
  'hover:border-amber-400 hover:bg-gradient-to-b hover:from-amber-50 hover:to-white hover:shadow-amber-200/50',
  'hover:border-pink-400 hover:bg-gradient-to-b hover:from-pink-50 hover:to-white hover:shadow-pink-200/50',
  'hover:border-cyan-400 hover:bg-gradient-to-b hover:from-cyan-50 hover:to-white hover:shadow-cyan-200/50',
  'hover:border-orange-400 hover:bg-gradient-to-b hover:from-orange-50 hover:to-white hover:shadow-orange-200/50',
  'hover:border-fuchsia-400 hover:bg-gradient-to-b hover:from-fuchsia-50 hover:to-white hover:shadow-fuchsia-200/50',
]

const PRICE_COLORS = ['text-emerald-600', 'text-sky-600', 'text-violet-600', 'text-amber-600', 'text-pink-600', 'text-cyan-600', 'text-orange-600', 'text-fuchsia-600']

export default function PosQuickAdd({ products, currency, onAdd, max = 8 }) {
  const picks = products.slice(0, max)
  if (picks.length === 0) return null

  return (
    <div>
      <p className="text-sm font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent mb-3">
        Quick add — tap a product
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {picks.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onAdd(p)}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-violet-100 bg-white shadow-sm hover:shadow-lg transition-all text-center group ${CARD_ACCENTS[i % CARD_ACCENTS.length]}`}
          >
            <ProductImage product={p} size="md" className="group-hover:scale-110 transition-transform ring-2 ring-white" />
            <span className="text-xs font-semibold text-slate-800 line-clamp-2 leading-tight">{p.name}</span>
            <span className={`text-xs font-bold ${PRICE_COLORS[i % PRICE_COLORS.length]}`}>{currency}{Number(p.price).toFixed(2)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
