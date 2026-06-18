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
import GroupsPage from './pages/GroupsPage'
import BarcodePage from './pages/BarcodePage'
import RecentlyBilledPage from './pages/RecentlyBilledPage'
import SupportPage from './Support/SupportPage'
import { SupportProvider } from './Support/SupportContext'

function AppContent() {
  const { isAuthenticated } = useAuth()
  const { isStoreReady } = useStore()
  const [currentPath, setCurrentPath] = useState('/')
  const [pageLoading, setPageLoading] = useState(true)

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

  const renderPage = () => {
    switch (currentPath) {
      case '/pos':
        return <PosPage />
      case '/recent-bills':
        return <RecentlyBilledPage />
      case '/support':
        return <SupportPage />
      case '/products':
        return <ProductsPage />
      case '/groups':
        return <GroupsPage />
      case '/reports':
        return <ReportsPage />
      case '/barcodes':
        return <BarcodePage />
      case '/settings':
        return <SettingsPage />
      default:
        return <DashboardPage onNavigate={setCurrentPath} />
    }
  }

  return (
    <MainLayout currentPath={currentPath} onNavigate={setCurrentPath}>
      {showSkeleton ? <PageSkeleton path={currentPath} /> : renderPage()}
    </MainLayout>
  )
}

export default function App() {
  return (
    <div className="h-full min-h-screen">
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
