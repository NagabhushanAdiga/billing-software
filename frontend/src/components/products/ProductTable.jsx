import { HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi'
import Button from '../common/Button'
import { useStore } from '../../context/StoreContext'

export default function ProductTable({ products, onEdit, onDelete, search, categoryFilter }) {
  const { settings } = useStore()
  const currency = settings?.currency || '₹'

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search)
    const matchCategory = !categoryFilter || p.category === categoryFilter
    return matchSearch && matchCategory
  })

  if (filtered.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-300 py-12 px-4">
        <p className="text-gray-500 text-center text-sm sm:text-base">
          {products.length === 0 ? 'No products. Add your first product.' : 'No products match the filter.'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-300 overflow-x-auto overflow-y-auto max-h-[60vh] min-w-0">
      <table className="w-full text-left min-w-[600px]">
        <thead className="bg-white text-gray-600 text-sm sticky top-0 z-10 border-b-2 border-gray-300">
          <tr>
            <th className="px-3 py-3 font-medium bg-white">Barcode</th>
            <th className="px-3 py-3 font-medium bg-white">Name</th>
            <th className="px-3 py-3 font-medium bg-white">Category</th>
            <th className="px-3 py-3 font-medium text-right bg-white">Price</th>
            <th className="px-3 py-3 font-medium w-28 text-right bg-white">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {filtered.map((p) => (
            <tr key={p.id} className="bg-white hover:bg-gray-50/80">
              <td className="px-3 py-3 font-mono text-gray-600 text-sm whitespace-nowrap">{p.barcode}</td>
              <td className="px-3 py-3 text-gray-900 font-medium">{p.name}</td>
              <td className="px-3 py-3 text-gray-500">{p.category}</td>
              <td className="px-3 py-3 text-emerald-600 text-right whitespace-nowrap">{currency}{Number(p.price).toFixed(2)}</td>
              <td className="px-3 py-3 text-right whitespace-nowrap">
                <Button variant="ghost" className="!py-1 !px-2 text-sm mr-1" onClick={() => onEdit(p)} title="Edit">
                  <HiOutlinePencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" className="!py-1 !px-2 text-sm text-red-500 hover:text-red-600" onClick={() => onDelete(p)} title="Delete">
                  <HiOutlineTrash className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
