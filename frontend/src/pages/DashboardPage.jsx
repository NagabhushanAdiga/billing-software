import { useMemo } from 'react'
import { HiOutlineCurrencyDollar, HiOutlineShoppingBag, HiOutlineArchive, HiOutlineCube } from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import PageHeader from '../components/common/PageHeader'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'

const statCards = [
  { key: 'todaySales', label: "Today's sales", Icon: HiOutlineCurrencyDollar, gradient: 'from-emerald-500 to-teal-500', bg: 'from-emerald-50 to-teal-50' },
  { key: 'todayOrders', label: 'Orders today', Icon: HiOutlineShoppingBag, gradient: 'from-sky-500 to-blue-600', bg: 'from-sky-50 to-blue-50' },
  { key: 'totalOrders', label: 'Total orders', Icon: HiOutlineArchive, gradient: 'from-violet-500 to-fuchsia-600', bg: 'from-violet-50 to-fuchsia-50' },
  { key: 'productCount', label: 'Products', Icon: HiOutlineCube, gradient: 'from-amber-500 to-orange-500', bg: 'from-amber-50 to-orange-50' },
]

export default function DashboardPage({ onNavigate }) {
  const { user } = useAuth()
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
    return { todaySales, todayOrders, totalOrders: orders.length, productCount: products.length }
  }, [orders, products])

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        title={`Welcome back, ${user?.name || 'there'}`}
        description="Here's a quick snapshot of your store today."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ key, label, Icon, gradient, bg }) => (
          <Card key={key} hover className={`p-5 overflow-hidden relative bg-gradient-to-br ${bg}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-2xl sm:text-3xl font-extrabold mt-2 text-slate-900 truncate tracking-tight">
                  {key === 'todaySales' ? `${currency}${stats.todaySales.toFixed(2)}` : stats[key]}
                </p>
              </div>
              <div className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-60`} />
          </Card>
        ))}
      </div>

      <Card className="p-6 sm:p-8 bg-gradient-to-br from-white to-violet-50/50">
        <h2 className="text-lg font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent mb-1">What would you like to do?</h2>
        <p className="text-slate-500 text-sm mb-5">Pick an action to get started.</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => onNavigate?.('/pos')}>Start billing</Button>
          <Button variant="outline" onClick={() => onNavigate?.('/groups')}>Manage groups</Button>
          <Button variant="outline" onClick={() => onNavigate?.('/reports')}>View reports</Button>
        </div>
      </Card>
    </div>
  )
}
