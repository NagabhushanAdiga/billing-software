import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { INITIAL_USERS } from '../data/staticData'

const STORAGE_KEYS = {
  user: 'billing_user',
  users: 'billing_users',
}

function loadUsers() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.users)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // fall through
  }
  return INITIAL_USERS
}

function toPublicUser(user) {
  const { password: _, ...rest } = user
  return rest
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [accounts, setAccounts] = useState(loadUsers)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.user)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(accounts))
  }, [accounts])

  const login = useCallback(
    (username, password) => {
      const found = accounts.find(
        (u) =>
          u.username.toLowerCase() === username.trim().toLowerCase() &&
          u.password === password
      )
      if (found) {
        const userData = toPublicUser(found)
        setUser(userData)
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData))
        return { success: true, user: userData }
      }
      return { success: false, error: 'Invalid username or password' }
    },
    [accounts]
  )

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEYS.user)
  }, [])

  const addUser = useCallback(({ name, username, password, role }) => {
    const trimmedName = String(name).trim()
    const trimmedUsername = String(username).trim().toLowerCase()
    const trimmedPassword = String(password)
    if (!trimmedName || !trimmedUsername || !trimmedPassword) {
      return { ok: false, error: 'All fields are required' }
    }
    if (!['cashier', 'manager'].includes(role)) {
      return { ok: false, error: 'Role must be cashier or manager' }
    }
    if (accounts.some((u) => u.username.toLowerCase() === trimmedUsername)) {
      return { ok: false, error: 'Username already exists' }
    }
    const id = `usr-${Date.now()}`
    setAccounts((prev) => [
      ...prev,
      { id, username: trimmedUsername, password: trimmedPassword, name: trimmedName, role },
    ])
    return { ok: true, id }
  }, [accounts])

  const deleteUser = useCallback((id, currentUserId) => {
    const target = accounts.find((u) => u.id === id)
    if (!target) return { ok: false, error: 'User not found' }
    if (target.role === 'admin') return { ok: false, error: 'Cannot delete admin account' }
    if (id === currentUserId) return { ok: false, error: 'Cannot delete your own account' }
    setAccounts((prev) => prev.filter((u) => u.id !== id))
    return { ok: true }
  }, [accounts])

  const verifyPassword = useCallback(
    (password) => {
      if (!user) return false
      const account = accounts.find((u) => u.id === user.id)
      return Boolean(account && account.password === password)
    },
    [accounts, user]
  )

  const changePassword = useCallback(
    ({ currentPassword, newPassword }) => {
      if (!user) return { ok: false, error: 'Not signed in' }
      if (user.role !== 'admin') return { ok: false, error: 'Only admin can change password here' }

      const trimmedNew = String(newPassword || '').trim()
      if (trimmedNew.length < 4) {
        return { ok: false, error: 'New password must be at least 4 characters' }
      }

      const account = accounts.find((u) => u.id === user.id)
      if (!account) return { ok: false, error: 'Account not found' }
      if (account.password !== currentPassword) {
        return { ok: false, error: 'Current password is incorrect' }
      }

      setAccounts((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, password: trimmedNew } : u))
      )
      return { ok: true }
    },
    [accounts, user]
  )

  const resetUserPassword = useCallback(
    ({ userId, newPassword }) => {
      if (!user || user.role !== 'admin') {
        return { ok: false, error: 'Only admin can reset team passwords' }
      }

      const trimmedNew = String(newPassword || '').trim()
      if (trimmedNew.length < 4) {
        return { ok: false, error: 'Password must be at least 4 characters' }
      }

      const target = accounts.find((u) => u.id === userId)
      if (!target) return { ok: false, error: 'User not found' }
      if (target.role === 'admin') {
        return { ok: false, error: 'Change admin password from Settings' }
      }

      setAccounts((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, password: trimmedNew } : u))
      )
      return { ok: true }
    },
    [accounts, user]
  )

  const teamMembers = accounts
    .filter((u) => u.role !== 'admin')
    .map(toPublicUser)

  return (
    <AuthContext.Provider
      value={{
        user,
        accounts,
        login,
        logout,
        isAuthenticated: !!user,
        teamMembers,
        addUser,
        deleteUser,
        changePassword,
        resetUserPassword,
        verifyPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/**
 * Orders visible to the current user on Recently billed.
 */
export function filterOrdersForUser(orders, user) {
  if (!user) return []
  if (user.role === 'admin') return orders
  return orders.filter(
    (o) =>
      o.createdBy?.id === user.id ||
      o.createdBy?.username === user.username
  )
}
