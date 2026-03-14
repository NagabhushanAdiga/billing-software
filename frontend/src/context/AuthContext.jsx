import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

const MOCK_USERS = [
  { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin' },
  { username: 'cashier', password: 'cashier123', role: 'cashier', name: 'Cashier' },
  { username: 'manager', password: 'manager123', role: 'manager', name: 'Manager' },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('billing_user')
    return saved ? JSON.parse(saved) : null
  })

  const login = useCallback((username, password) => {
    const found = MOCK_USERS.find(
      (u) => u.username === username && u.password === password
    )
    if (found) {
      const { password: _, ...userData } = found
      setUser(userData)
      localStorage.setItem('billing_user', JSON.stringify(userData))
      return { success: true, user: userData }
    }
    return { success: false, error: 'Invalid username or password' }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('billing_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
