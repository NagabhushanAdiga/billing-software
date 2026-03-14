import { useMemo } from 'react'
import { HiOutlineCurrencyDollar, HiOutlineShoppingBag, HiOutlineArchive, HiOutlineCube } from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { useStore } from '../context/StoreContext'

const statCards = [
  { key: 'todaySales', label: "Today's sales", Icon: HiOutlineCurrencyDollar, accent: 'border-l-emerald-500 bg-emerald-50/30', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', valueColor: 'text-emerald-700' },
  { key: 'todayOrders', label: 'Orders today', Icon: HiOutlineShoppingBag, accent: 'border-l-blue-500 bg-blue-50/30', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', valueColor: 'text-gray-900' },
  { key: 'totalOrders', label: 'Total orders', Icon: HiOutlineArchive, accent: 'border-l-violet-500 bg-violet-50/30', iconBg: 'bg-violet-100', iconColor: 'text-violet-600', valueColor: 'text-gray-900' },
  { key: 'productCount', label: 'Products', Icon: HiOutlineCube, accent: 'border-l-amber-500 bg-amber-50/30', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', valueColor: 'text-gray-900' },
]

export default function DashboardPage({ onNavigate }) {
  const { orders, products, settings } = useStore()
  const currency = settings?.currency || '₹'

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    let todaySales = 0
    let todayOrders = 0
    orders.forEach((o) => {
      if (new Date(o.date).toDateString() === today) {
        todaySales += o.total
        todayOrders += 1
      }
    })
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0)
    return { todaySales, todayOrders, totalOrders: orders.length, totalSales, productCount: products.length }
  }, [orders, products])

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your store</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map(({ key, label, Icon, accent, iconBg, iconColor, valueColor }) => (
          <Card key={key} className={`p-5 border-l-4 ${accent}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">{label}</p>
                <p className={`text-2xl font-bold mt-1 truncate ${valueColor}`}>
                  {key === 'todaySales' ? `${currency}${stats.todaySales.toFixed(2)}` : stats[key]}
                </p>
              </div>
              <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 border-2 border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Quick actions</h2>
        <p className="text-gray-500 text-sm mb-4">Navigate to POS, products, or reports.</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => onNavigate?.('/pos')}>Open POS / Billing</Button>
          <Button variant="secondary" onClick={() => onNavigate?.('/products')}>Manage products</Button>
          <Button variant="secondary" onClick={() => onNavigate?.('/reports')}>View reports</Button>
        </div>
      </Card>
    </div>
  )
}
