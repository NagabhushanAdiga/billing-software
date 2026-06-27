import { useAuth } from '../../context/AuthContext'
import { getNavItemsForRole } from '../../config/navItems'

const ICON_COLORS = ['text-emerald-400', 'text-sky-400', 'text-amber-400', 'text-violet-400', 'text-pink-400', 'text-slate-400']

export default function Sidebar({ currentPath, onNavigate, open = false }) {
  const { user } = useAuth()
  const visible = getNavItemsForRole(user?.role)

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
          const { Icon, active, label } = item
          return (
            <button
              key={item.path}
              onClick={() => onNavigate?.(item.path)}
              className={`w-full group flex items-center gap-3 px-4 py-3 rounded-md text-left text-sm font-semibold cursor-pointer transition-all duration-200 ${
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
              <span className="flex-1 truncate">{label}</span>
            </button>
          )
        })}
      </nav>
      <div className="mt-auto mx-3 px-3 py-3 rounded-md bg-white/10 border border-white/10 shrink-0">
        <p className="text-xs text-white font-semibold truncate">{user?.name}</p>
        <p className="text-[10px] text-violet-300 capitalize mt-0.5">{user?.role}</p>
      </div>
    </aside>
  )
}
