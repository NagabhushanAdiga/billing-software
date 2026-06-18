import { useState } from 'react'
import { HiOutlineLogout, HiOutlineMenu } from 'react-icons/hi'
import { IoStorefrontOutline } from 'react-icons/io5'
import { useAuth } from '../../context/AuthContext'
import { useStore } from '../../context/StoreContext'
import Button from '../common/Button'
import ConfirmDialog from '../common/ConfirmDialog'
import { useAsyncAction, delay } from '../../hooks/useAsyncAction'

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { settings } = useStore()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { loading: loggingOut, run: runLogout } = useAsyncAction()

  const handleLogoutClick = () => setShowLogoutConfirm(true)
  const handleLogoutConfirm = () => {
    runLogout(async () => {
      await delay(300)
      logout()
      setShowLogoutConfirm(false)
    })
  }

  return (
    <>
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/80 backdrop-blur-xl border-b-2 border-transparent shrink-0 z-20 relative">
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-sky-500 via-50% to-fuchsia-500" />
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-1 rounded-md text-violet-700 hover:bg-violet-100 transition-colors"
            aria-label="Open menu"
          >
            <HiOutlineMenu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/30 shrink-0">
              <IoStorefrontOutline className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <span className="block text-base sm:text-lg font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent truncate leading-tight">
                {settings?.storeName || 'SuperMart Billing'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200/80">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-800 text-xs font-bold capitalize">{user?.role}</span>
          </div>
          <span className="text-violet-900 text-sm font-semibold hidden md:inline">{user?.name}</span>
          <Button variant="ghost" onClick={handleLogoutClick} className="!p-2 sm:!px-3 rounded-md">
            <HiOutlineLogout className="w-5 h-5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmLabel="Logout"
        variant="danger"
        confirmLoading={loggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  )
}
