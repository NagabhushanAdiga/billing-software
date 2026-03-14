import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

export default function MainLayout({ children, currentPath, onNavigate }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleNavigate = (path) => {
    onNavigate?.(path)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header onMenuClick={() => setSidebarOpen((o) => !o)} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          currentPath={currentPath}
          onNavigate={handleNavigate}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 min-w-0 overflow-auto p-4 sm:p-6 bg-white">
          {children}
        </main>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
