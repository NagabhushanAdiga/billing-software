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
    { label: 'Total sales', value: `${currency}${stats.totalSales.toFixed(2)}`, Icon: HiOutlineCurrencyDollar, bg: 'bg-emerald-50', iconColor: 'text-emerald-600', valueColor: 'text-emerald-600' },
    { label: 'Total orders', value: stats.orderCount, Icon: HiOutlineClipboardList, bg: 'bg-blue-50', iconColor: 'text-blue-600', valueColor: 'text-gray-900' },
    { label: "Today's sales", value: `${currency}${stats.todaySales.toFixed(2)}`, Icon: HiOutlineTrendingUp, bg: 'bg-violet-50', iconColor: 'text-violet-600', valueColor: 'text-violet-600' },
    { label: 'Orders today', value: stats.todayCount, Icon: HiOutlineShoppingBag, bg: 'bg-amber-50', iconColor: 'text-amber-600', valueColor: 'text-gray-900' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Sales and billing summary</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map(({ label, value, Icon, bg, iconColor, valueColor }) => (
          <Card key={label} className={`p-4 ${bg} border-0`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${valueColor}`}>{value}</p>
              </div>
              <Icon className={`w-10 h-10 ${iconColor}`} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent orders</h2>
          <div className="overflow-auto max-h-80">
            {orders.length === 0 ? (
              <p className="text-gray-500 text-sm">No orders yet.</p>
            ) : (
              <ul className="space-y-2">
                {orders.slice(0, 20).map((o) => (
                  <li key={o.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-gray-900 text-sm font-medium">{o.id}</p>
                      <p className="text-gray-500 text-xs">{formatDate(o.date)}</p>
                    </div>
                    <span className="text-emerald-600 font-medium">{currency}{o.total.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Top products (by quantity sold)</h2>
          <div className="overflow-auto max-h-80">
            {stats.topProducts.length === 0 ? (
              <p className="text-gray-500 text-sm">No sales data yet.</p>
            ) : (
              <ul className="space-y-2">
                {stats.topProducts.map((item, i) => (
                  <li key={item.name} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-600 text-sm">{i + 1}. {item.name}</span>
                    <span className="text-gray-900 font-medium">{item.qty} sold</span>
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
