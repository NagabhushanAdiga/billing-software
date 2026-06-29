import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Button from '../common/Button'
import Input from '../common/Input'
import { useAsyncAction, delay } from '../../hooks/useAsyncAction'

export default function LoginForm({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const { loading, run } = useAsyncAction()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    run(async () => {
      await delay(300)
      const result = await login(username, password)
      if (result.success) {
        onSuccess?.()
      } else {
        setError(result.error || 'Login failed')
      }
    })
  }

  return (
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
  )
}
