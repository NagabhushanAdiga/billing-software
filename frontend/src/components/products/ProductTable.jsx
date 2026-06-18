import { HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi'
import Button from '../common/Button'
import ProductImage from '../common/ProductImage'
import { useStore } from '../../context/StoreContext'

const GROUP_BADGE_COLORS = [
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
]

export default function ProductTable({ products, onEdit, onDelete, search, groupFilter }) {
  const { settings, getGroupById } = useStore()
  const currency = settings?.currency || '₹'

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search)
    const matchGroup = !groupFilter || p.groupId === groupFilter
    return matchSearch && matchGroup
  })

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-violet-200 py-16 px-4 bg-violet-50/30">
        <p className="text-violet-500 text-center text-sm font-medium">
          {products.length === 0 ? 'No products yet. Add your first product.' : 'No products match the filter.'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border-2 border-violet-100 overflow-x-auto overflow-y-auto max-h-[60vh] min-w-0 shadow-sm">
      <table className="w-full text-left min-w-[720px]">
        <thead className="bg-gradient-to-r from-violet-50 to-fuchsia-50 text-violet-700 text-xs font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-violet-200">
          <tr>
            <th className="px-4 py-3.5 w-16">Image</th>
            <th className="px-4 py-3.5">Barcode</th>
            <th className="px-4 py-3.5">Name</th>
            <th className="px-4 py-3.5">Group</th>
            <th className="px-4 py-3.5 text-right">Price</th>
            <th className="px-4 py-3.5 w-28 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filtered.map((p, i) => {
            const groupName = getGroupById(p.groupId)?.name || p.category || 'No group'
            const badgeColor = GROUP_BADGE_COLORS[i % GROUP_BADGE_COLORS.length]
            return (
              <tr key={p.id} className="hover:bg-violet-50/50 transition-colors">
                <td className="px-4 py-3">
                  <ProductImage product={p} size="sm" />
                </td>
                <td className="px-4 py-3.5 font-mono text-slate-500 text-xs whitespace-nowrap">{p.barcode}</td>
                <td className="px-4 py-3.5 text-slate-900 font-semibold text-sm">{p.name}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${badgeColor}`}>{groupName}</span>
                </td>
                <td className="px-4 py-3.5 text-fuchsia-600 font-bold text-sm text-right whitespace-nowrap">{currency}{Number(p.price).toFixed(2)}</td>
                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                  <Button variant="ghost" className="!py-1.5 !px-2 !rounded-md" onClick={() => onEdit(p)} title="Edit">
                    <HiOutlinePencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" className="!py-1.5 !px-2 !rounded-md text-red-400 hover:text-red-600" onClick={() => onDelete(p)} title="Delete">
                    <HiOutlineTrash className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
