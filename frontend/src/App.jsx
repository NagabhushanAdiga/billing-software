import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { StoreProvider } from './context/StoreContext'
import LoginPage from './components/auth/LoginPage'
import MainLayout from './components/layout/MainLayout'
import DashboardPage from './pages/DashboardPage'
import PosPage from './pages/PosPage'
import ProductsPage from './pages/ProductsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'

function AppContent() {
  const { isAuthenticated } = useAuth()
  const [currentPath, setCurrentPath] = useState('/')

  if (!isAuthenticated) {
    return <LoginPage onSuccess={() => {}} />
  }

  const renderPage = () => {
    switch (currentPath) {
      case '/pos':
        return <PosPage />
      case '/products':
        return <ProductsPage />
      case '/reports':
        return <ReportsPage />
      case '/settings':
        return <SettingsPage />
      default:
        return <DashboardPage onNavigate={setCurrentPath} />
    }
  }

  return (
    <MainLayout currentPath={currentPath} onNavigate={setCurrentPath}>
      {renderPage()}
    </MainLayout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </AuthProvider>
  )
}
