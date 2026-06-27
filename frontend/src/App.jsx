import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { StoreProvider, useStore } from './context/StoreContext'
import { ToastProvider } from './context/ToastContext'
import LoginPage from './components/auth/LoginPage'
import MainLayout from './components/layout/MainLayout'
import { PageSkeleton } from './components/common/PageSkeleton'
import DashboardPage from './pages/DashboardPage'
import PosPage from './pages/PosPage'
import ProductsPage from './pages/ProductsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import TeamPage from './pages/TeamPage'
import GroupsPage from './pages/GroupsPage'
import SubcategoriesPage from './pages/SubcategoriesPage'
import BarcodePage from './pages/BarcodePage'
import RecentlyBilledPage from './pages/RecentlyBilledPage'
import SupportPage from './Support/SupportPage'
import { SupportProvider } from './Support/SupportContext'
import { canAccessPath } from './config/navItems'

function AppContent() {
  const { isAuthenticated, user } = useAuth()
  const { isStoreReady } = useStore()
  const [currentPath, setCurrentPath] = useState('/')
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentPath('/')
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!user?.role) return
    if (!canAccessPath(currentPath, user.role)) {
      setCurrentPath('/')
    }
  }, [user?.role, currentPath])

  const handleNavigate = (path) => {
    if (user?.role && canAccessPath(path, user.role)) {
      setCurrentPath(path)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return undefined
    setPageLoading(true)
    const timer = setTimeout(() => setPageLoading(false), 380)
    return () => clearTimeout(timer)
  }, [currentPath, isAuthenticated])

  if (!isAuthenticated) {
    return <LoginPage onSuccess={() => {}} />
  }

  const showSkeleton = !isStoreReady || pageLoading
  const safePath = canAccessPath(currentPath, user?.role) ? currentPath : '/'

  const renderPage = () => {
    switch (safePath) {
      case '/pos':
        return <PosPage />
      case '/recent-bills':
        return <RecentlyBilledPage />
      case '/support':
        return <SupportPage />
      case '/products':
        return <ProductsPage />
      case '/categories':
      case '/groups':
        return <GroupsPage />
      case '/subcategories':
        return <SubcategoriesPage />
      case '/reports':
        return <ReportsPage />
      case '/barcodes':
        return <BarcodePage />
      case '/settings':
        return <SettingsPage />
      case '/team':
        return <TeamPage />
      default:
        return <DashboardPage onNavigate={handleNavigate} />
    }
  }

  return (
    <MainLayout currentPath={safePath} onNavigate={handleNavigate}>
      {showSkeleton ? <PageSkeleton path={safePath} /> : renderPage()}
    </MainLayout>
  )
}

export default function App() {
  return (
    <div className="h-full min-h-screen bg-white">
      <AuthProvider>
        <StoreProvider>
          <SupportProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </SupportProvider>
        </StoreProvider>
      </AuthProvider>
    </div>
  )
}
