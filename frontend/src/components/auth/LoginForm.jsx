import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Button from '../common/Button'
import Input from '../common/Input'
import Card from '../common/Card'
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
    <Card className="p-8 w-full max-w-md shadow-2xl border-2 border-violet-200/50 ring-4 ring-fuchsia-500/10">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">Welcome back</h2>
          <p className="text-slate-500 text-sm mt-1">Sign in to continue</p>
        </div>
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
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
        )}
        <Button type="submit" className="w-full py-3" loading={loading}>
          Sign in
        </Button>
      </form>
      <div className="mt-6 pt-5 border-t border-slate-100">
        <p className="text-xs text-slate-500 text-center mb-3">Quick demo login — tap a role:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.username}
              type="button"
              onClick={() => fillDemo(acc)}
              className="px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-800 border border-violet-200 hover:from-violet-200 hover:to-fuchsia-200 transition-colors"
            >
              {acc.label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}
