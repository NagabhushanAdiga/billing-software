import { useState } from 'react'
import { HiOutlineLogout, HiOutlineMenu } from 'react-icons/hi'
import { IoStorefrontOutline } from 'react-icons/io5'
import { useAuth } from '../../context/AuthContext'
import { useStore } from '../../context/StoreContext'
import Button from '../common/Button'
import ConfirmDialog from '../common/ConfirmDialog'

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { settings } = useStore()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogoutClick = () => setShowLogoutConfirm(true)
  const handleLogoutConfirm = () => {
    logout()
    setShowLogoutConfirm(false)
  }

  return (
    <>
      <header className="h-14 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <HiOutlineMenu className="w-6 h-6" />
          </button>
          <span className="flex items-center gap-2 text-base sm:text-xl font-bold text-emerald-600 truncate">
            <IoStorefrontOutline className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
            <span className="truncate">{settings?.storeName || 'SuperMart Billing'}</span>
          </span>
          <span className="text-gray-400 text-sm hidden sm:inline shrink-0">|</span>
          <span className="text-gray-500 text-sm hidden sm:inline shrink-0">POS</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <span className="text-gray-600 text-xs sm:text-sm hidden sm:inline">
            <span className="text-gray-500">Role:</span>{' '}
            <span className="capitalize font-medium text-emerald-600">{user?.role}</span>
          </span>
          <span className="text-gray-600 text-sm hidden md:inline">{user?.name}</span>
          <Button variant="ghost" onClick={handleLogoutClick} className="flex items-center gap-1 sm:gap-2 !p-2 sm:!p-2">
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
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  )
}
