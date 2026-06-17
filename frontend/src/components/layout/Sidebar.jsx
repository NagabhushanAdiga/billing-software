import { useAuth } from '../../context/AuthContext'
import {
  HiOutlineViewGrid,
  HiOutlineShoppingCart,
  HiOutlineCube,
  HiOutlineCollection,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineQrcode,
} from 'react-icons/hi'

const navItems = [
  { path: '/', label: 'Dashboard', Icon: HiOutlineViewGrid, roles: ['admin', 'cashier', 'manager'], active: 'from-emerald-500 to-teal-500 shadow-emerald-500/40' },
  { path: '/pos', label: 'POS / Billing', Icon: HiOutlineShoppingCart, roles: ['admin', 'cashier', 'manager'], active: 'from-blue-500 to-cyan-500 shadow-blue-500/40' },
  { path: '/products', label: 'Products', Icon: HiOutlineCube, roles: ['admin', 'manager'], active: 'from-orange-500 to-amber-500 shadow-orange-500/40' },
  { path: '/groups', label: 'Groups', Icon: HiOutlineCollection, roles: ['admin', 'manager'], active: 'from-violet-500 to-purple-500 shadow-violet-500/40' },
  { path: '/barcodes', label: 'Barcodes', Icon: HiOutlineQrcode, roles: ['admin', 'manager'], active: 'from-fuchsia-500 to-pink-500 shadow-fuchsia-500/40' },
  { path: '/reports', label: 'Reports', Icon: HiOutlineChartBar, roles: ['admin', 'manager'], active: 'from-pink-500 to-rose-500 shadow-pink-500/40' },
  { path: '/settings', label: 'Settings', Icon: HiOutlineCog, roles: ['admin'], active: 'from-slate-500 to-slate-600 shadow-slate-500/40' },
]

const ICON_COLORS = ['text-emerald-400', 'text-sky-400', 'text-amber-400', 'text-violet-400', 'text-pink-400', 'text-slate-400']

export default function Sidebar({ currentPath, onNavigate, open = false }) {
  const { user } = useAuth()
  const visible = navItems.filter((item) => item.roles.includes(user?.role))

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 h-full w-full lg:w-72 lg:shrink-0 flex flex-col py-5 overflow-hidden transform transition-transform duration-300 ease-out shadow-2xl lg:shadow-none bg-gradient-to-b from-indigo-950 via-violet-950 to-fuchsia-950 border-r border-white/10 ${
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="px-4 mb-4 hidden lg:block shrink-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300/70">Menu</p>
      </div>
      <nav className="flex flex-col gap-1.5 px-3 overflow-y-auto flex-1 w-full">
        {visible.map((item, idx) => {
          const isActive = currentPath === item.path
          const { Icon, active } = item
          return (
            <button
              key={item.path}
              onClick={() => onNavigate?.(item.path)}
              className={`w-full group flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? `bg-gradient-to-r ${active} text-white shadow-lg scale-[1.02]`
                  : 'text-violet-200/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span
                className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-colors ${
                  isActive ? 'bg-white/25' : `bg-white/10 ${ICON_COLORS[idx % ICON_COLORS.length]}`
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-white' : ''}`} />
              </span>
              <span className="flex-1 truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="mt-auto mx-3 px-3 py-3 rounded-xl bg-white/10 border border-white/10 shrink-0">
        <p className="text-xs text-white font-semibold truncate">{user?.name}</p>
        <p className="text-[10px] text-violet-300 capitalize mt-0.5">{user?.role}</p>
      </div>
    </aside>
  )
}
