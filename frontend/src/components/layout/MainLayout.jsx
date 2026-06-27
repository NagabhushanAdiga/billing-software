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
    <div className="h-full flex flex-col overflow-hidden app-shell">
      <Header onMenuClick={() => setSidebarOpen((o) => !o)} />
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <Sidebar
          currentPath={currentPath}
          onNavigate={handleNavigate}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 min-w-0 h-full overflow-auto p-4 sm:p-6 lg:p-8 bg-white">
          <div className="h-full min-h-full w-full">{children}</div>
        </main>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden cursor-pointer"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
