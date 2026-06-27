import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Button from '../common/Button'
import Input from '../common/Input'
import { useAsyncAction, delay } from '../../hooks/useAsyncAction'

const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', label: 'Admin' },
  { username: 'cashier', password: 'cashier123', label: 'Cashier' },
  { username: 'manager', password: 'manager123', label: 'Manager' },
]

export default function LoginForm({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const { loading, run } = useAsyncAction()

  const tryLogin = async (u, p) => {
    setError('')
    await run(async () => {
      await delay(300)
      const result = login(u, p)
      if (result.success) {
        onSuccess?.()
      } else {
        setError(result.error || 'Login failed')
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    tryLogin(username, password)
  }

  const fillDemo = ({ username: u, password: p }) => {
    setUsername(u)
    setPassword(p)
    setError('')
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          autoComplete="username"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
        )}
        <Button type="submit" className="w-full py-3" loading={loading}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100">
        <p className="text-xs text-slate-500 text-center mb-3 font-medium">Quick demo — tap a role to fill credentials:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.username}
              type="button"
              onClick={() => fillDemo(acc)}
              className="px-3 py-1.5 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
