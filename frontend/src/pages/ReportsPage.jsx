import { useMemo } from 'react'
import { HiOutlineCurrencyDollar, HiOutlineShoppingBag, HiOutlineTrendingUp, HiOutlineClipboardList } from 'react-icons/hi'
import Card from '../components/common/Card'
import { useStore } from '../context/StoreContext'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ReportsPage() {
  const { orders, settings } = useStore()
  const currency = settings?.currency || '₹'

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    let totalSales = 0
    let orderCount = orders.length
    let todaySales = 0
    let todayCount = 0
    const productCount = {}

    orders.forEach((o) => {
      totalSales += o.total
      if (new Date(o.date).toDateString() === today) {
        todaySales += o.total
        todayCount += 1
      }
      o.items.forEach((i) => {
        productCount[i.name] = (productCount[i.name] || 0) + i.qty
      })
    })

    const topProducts = Object.entries(productCount)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10)

    return { totalSales, orderCount, todaySales, todayCount, topProducts }
  }, [orders])

  const reportCards = [
    { label: 'Total sales', value: `${currency}${stats.totalSales.toFixed(2)}`, Icon: HiOutlineCurrencyDollar, gradient: 'from-emerald-500 to-teal-600' },
    { label: 'Total orders', value: stats.orderCount, Icon: HiOutlineClipboardList, gradient: 'from-blue-500 to-indigo-600' },
    { label: "Today's sales", value: `${currency}${stats.todaySales.toFixed(2)}`, Icon: HiOutlineTrendingUp, gradient: 'from-violet-500 to-purple-600' },
    { label: 'Orders today', value: stats.todayCount, Icon: HiOutlineShoppingBag, gradient: 'from-amber-500 to-orange-600' },
  ]

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Reports</h1>
        <p className="text-slate-500 text-sm mt-1">Sales and billing analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map(({ label, value, Icon, gradient }) => (
          <Card key={label} hover className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-extrabold mt-2 text-slate-900 tracking-tight">{value}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Recent orders</h2>
          <div className="overflow-auto max-h-80 -mx-1 px-1">
            {orders.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No orders yet.</p>
            ) : (
              <ul className="space-y-1">
                {orders.slice(0, 20).map((o) => (
                  <li key={o.id} className="flex justify-between items-center py-3 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-slate-900 text-sm font-semibold">{o.id}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{formatDate(o.date)}</p>
                    </div>
                    <span className="text-emerald-600 font-bold text-sm">{currency}{o.total.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Top products</h2>
          <div className="overflow-auto max-h-80 -mx-1 px-1">
            {stats.topProducts.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No sales data yet.</p>
            ) : (
              <ul className="space-y-1">
                {stats.topProducts.map((item, i) => (
                  <li key={item.name} className="flex justify-between items-center py-3 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <span className="text-slate-600 text-sm">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold mr-2">{i + 1}</span>
                      {item.name}
                    </span>
                    <span className="text-slate-900 font-bold text-sm">{item.qty} sold</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
