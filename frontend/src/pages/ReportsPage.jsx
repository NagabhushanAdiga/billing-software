import { useMemo, useState } from 'react'
import {
  HiOutlineCurrencyDollar,
  HiOutlineShoppingBag,
  HiOutlineTrendingUp,
  HiOutlineClipboardList,
  HiOutlineDownload,
  HiOutlineSearch,
  HiOutlineFilter,
} from 'react-icons/hi'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import PageHeader from '../components/common/PageHeader'
import TableIdentityCell from '../components/common/TableIdentityCell'
import { useStore } from '../context/StoreContext'
import { useToast } from '../context/ToastContext'
import { useAsyncAction, delay } from '../hooks/useAsyncAction'
import {
  buildSalesDetailRows,
  buildFilteredStats,
  exportSalesReportExcel,
} from '../utils/exportSalesReport'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const EMPTY_FILTERS = {
  dateFrom: '',
  dateTo: '',
  productQuery: '',
  categoryId: '',
}

export default function ReportsPage() {
  const { orders, products, groups, settings } = useStore()
  const { showToast } = useToast()
  const { loading: exporting, run: runExport } = useAsyncAction()
  const currency = settings?.currency || '₹'
  const storeMeta = {
    storeName: settings?.storeName || 'Store',
    storeAddress: settings?.storeAddress || '',
    storeGstin: settings?.storeGstin || '',
    storeWebsite: settings?.storeWebsite || '',
  }

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)

  const stats = useMemo(
    () => buildFilteredStats(orders, products, filters),
    [orders, products, filters]
  )

  const salesRows = useMemo(
    () => buildSalesDetailRows(orders, products, filters),
    [orders, products, filters]
  )

  const productByBarcode = useMemo(() => {
    const map = new Map()
    products.forEach((p) => map.set(p.barcode, p))
    return map
  }, [products])

  const productByName = useMemo(() => {
    const map = new Map()
    products.forEach((p) => map.set(p.name, p))
    return map
  }, [products])

  const filteredOrders = useMemo(() => {
    const ids = new Set(salesRows.map((r) => r['Order ID']))
    return orders.filter((o) => ids.has(o.id))
  }, [orders, salesRows])

  const reportCards = [
    {
      label: 'Filtered sales',
      value: `${currency}${stats.totalSales.toFixed(2)}`,
      Icon: HiOutlineCurrencyDollar,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Orders',
      value: stats.orderCount,
      Icon: HiOutlineClipboardList,
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Items sold',
      value: stats.totalSoldItems,
      Icon: HiOutlineTrendingUp,
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      label: 'Product lines',
      value: salesRows.length,
      Icon: HiOutlineShoppingBag,
      gradient: 'from-amber-500 to-orange-600',
    },
  ]

  const applyFilters = () => {
    setFilters({ ...draftFilters })
    showToast('Filters applied')
  }

  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS)
    setFilters(EMPTY_FILTERS)
    showToast('Filters cleared', 'info')
  }

  const handleExport = () => {
    runExport(async () => {
      await delay(200)
      try {
        const filename = exportSalesReportExcel(orders, products, filters, storeMeta)
        showToast(`Exported ${filename}`)
      } catch (err) {
        showToast(err.message || 'Could not export report', 'error')
      }
    })
  }

  const hasActiveFilters =
    filters.dateFrom || filters.dateTo || filters.productQuery || filters.categoryId

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <PageHeader
        icon={HiOutlineClipboardList}
        iconClassName="from-pink-500 to-rose-600 shadow-pink-500/25"
        title="Reports"
        description="Filter sales by date, product, or category and export to Excel."
      >
        <Button onClick={handleExport} loading={exporting} disabled={salesRows.length === 0}>
          <HiOutlineDownload className="w-5 h-5" />
          Export Excel
        </Button>
      </PageHeader>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <HiOutlineFilter className="w-5 h-5 text-violet-600" />
          <h2 className="text-base font-bold text-slate-900">Filters</h2>
          {hasActiveFilters && (
            <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
              Active
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="From date"
            type="date"
            value={draftFilters.dateFrom}
            onChange={(e) => setDraftFilters((f) => ({ ...f, dateFrom: e.target.value }))}
          />
          <Input
            label="To date"
            type="date"
            value={draftFilters.dateTo}
            onChange={(e) => setDraftFilters((f) => ({ ...f, dateTo: e.target.value }))}
          />
          <Input
            label="Product"
            icon={HiOutlineSearch}
            placeholder="Search name or barcode..."
            value={draftFilters.productQuery}
            onChange={(e) => setDraftFilters((f) => ({ ...f, productQuery: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
            <select
              value={draftFilters.categoryId}
              onChange={(e) => setDraftFilters((f) => ({ ...f, categoryId: e.target.value }))}
              className="field-select"
            >
              <option value="">All categories</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button type="button" onClick={applyFilters}>Apply filters</Button>
          <Button type="button" variant="outline" onClick={clearFilters}>Clear</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map(({ label, value, Icon, gradient }) => (
          <Card key={label} hover className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-extrabold mt-2 text-slate-900 tracking-tight">{value}</p>
              </div>
              <div className={`w-11 h-11 rounded-md bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Sales report</h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Product sold, sold date, sold qty, total stock, and remaining stock
            </p>
          </div>
          <Button variant="secondary" onClick={handleExport} loading={exporting} disabled={salesRows.length === 0}>
            <HiOutlineDownload className="w-4 h-4" />
            Export Excel
          </Button>
        </div>

        {salesRows.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-12 border-2 border-dashed border-slate-200 rounded-md">
            No sales match the selected filters.
          </p>
        ) : (
          <div className="rounded-md border border-violet-100 overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-gradient-to-r from-violet-50 to-fuchsia-50 text-violet-700 text-xs font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-violet-200">
                <tr>
                  <th className="px-4 py-3">Product sold</th>
                  <th className="px-4 py-3">Sold date</th>
                  <th className="px-4 py-3 text-right">Sold items</th>
                  <th className="px-4 py-3 text-right">Total stock</th>
                  <th className="px-4 py-3 text-right">Remaining stock</th>
                  <th className="px-4 py-3">Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesRows.map((row, i) => (
                  <tr key={`${row['Order ID']}-${row.Barcode}-${i}`} className="hover:bg-violet-50/40">
                    <td className="px-4 py-3">
                      <TableIdentityCell
                        product={productByBarcode.get(row.Barcode)}
                        title={row['Product Sold']}
                        subtitle={row.Barcode}
                        name={row['Product Sold']}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm whitespace-nowrap">{row['Sold Date']}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{row['Sold Items']}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{row['Total Stock']}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{row['Remaining Stock']}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">{row['Order ID']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Recent orders</h2>
          <div className="overflow-auto max-h-80 -mx-1 px-1">
            {filteredOrders.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No orders match filters.</p>
            ) : (
              <ul className="space-y-1">
                {filteredOrders.slice(0, 20).map((o) => (
                  <li key={o.id} className="flex justify-between items-center gap-3 py-3 px-3 rounded-md hover:bg-slate-50 transition-colors">
                    <TableIdentityCell
                      title={o.customerName?.trim() || 'Walk-in customer'}
                      subtitle={`${o.id} · ${formatDate(o.date)}`}
                      name={o.customerName?.trim() || 'Walk-in customer'}
                      avatarFallback="W"
                      subtitleClassName="text-slate-400 text-xs mt-0.5 truncate"
                    />
                    <span className="text-emerald-600 font-bold text-sm shrink-0">{currency}{Number(o.total).toFixed(2)}</span>
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
                {stats.topProducts.map((item) => (
                  <li key={item.name} className="flex justify-between items-center gap-3 py-3 px-3 rounded-md hover:bg-slate-50 transition-colors">
                    <TableIdentityCell
                      product={productByName.get(item.name)}
                      title={item.name}
                      name={item.name}
                      className="flex-1 min-w-0"
                    />
                    <span className="text-slate-900 font-bold text-sm shrink-0">{item.qty} sold</span>
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
