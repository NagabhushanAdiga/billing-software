import { useAuth } from '../../context/AuthContext'
import { HiOutlineViewGrid, HiOutlineShoppingCart, HiOutlineCube, HiOutlineChartBar, HiOutlineCog } from 'react-icons/hi'

const navItems = [
  { path: '/', label: 'Dashboard', Icon: HiOutlineViewGrid, color: 'emerald', roles: ['admin', 'cashier', 'manager'] },
  { path: '/pos', label: 'POS / Billing', Icon: HiOutlineShoppingCart, color: 'blue', roles: ['admin', 'cashier', 'manager'] },
  { path: '/products', label: 'Products', Icon: HiOutlineCube, color: 'violet', roles: ['admin', 'manager'] },
  { path: '/reports', label: 'Reports', Icon: HiOutlineChartBar, color: 'amber', roles: ['admin', 'manager'] },
  { path: '/settings', label: 'Settings', Icon: HiOutlineCog, color: 'slate', roles: ['admin'] },
]

export default function Sidebar({ currentPath, onNavigate, open = false }) {
  const { user } = useAuth()
  const visible = navItems.filter((item) => item.roles.includes(user?.role))

  return (
    <aside
      className={`fixed lg:relative top-0 left-0 z-40 h-full w-64 max-w-[85vw] lg:w-56 bg-white border-r border-gray-200 shadow-lg lg:shadow-sm flex flex-col py-4 transform transition-transform duration-200 ease-out ${
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <nav className="flex flex-col gap-1 px-3 overflow-y-auto">
        {visible.map((item) => {
          const isActive = currentPath === item.path
          const { Icon, color } = item
          const activeBg = {
            emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            blue: 'bg-blue-50 text-blue-700 border-blue-200',
            violet: 'bg-violet-50 text-violet-700 border-violet-200',
            amber: 'bg-amber-50 text-amber-700 border-amber-200',
            slate: 'bg-gray-100 text-gray-800 border-gray-200',
          }[color]
          const iconColor = isActive ? 'currentColor' : 'text-gray-500'
          return (
            <button
              key={item.path}
              onClick={() => onNavigate?.(item.path)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-sm font-medium transition-colors border ${
                isActive ? `${activeBg}` : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

