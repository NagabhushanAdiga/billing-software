import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Button from '../common/Button'
import Input from '../common/Input'
import Card from '../common/Card'

export default function LoginForm({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const result = login(username, password)
    if (result.success) {
      onSuccess?.()
    } else {
      setError(result.error || 'Login failed')
    }
  }

  return (
    <Card className="p-8 w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Sign in</h2>
          <p className="text-gray-500 text-sm mt-1">Role-based access • SuperMart Billing</p>
        </div>
        <Input
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin / cashier / manager"
          autoComplete="username"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" className="w-full py-2.5">
          Login
        </Button>
      </form>
      <p className="text-xs text-gray-500 mt-4 text-center">
        Demo: admin/admin123, cashier/cashier123, manager/manager123
      </p>
    </Card>
  )
}
