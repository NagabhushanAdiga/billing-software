const TOKEN_KEY = 'billing_token'

export const API_BASE = import.meta.env.VITE_API_URL || ''
export const USE_API = Boolean(API_BASE)

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    const err = new Error(
      'Cannot reach the server. Start the backend: cd backend && npm run dev'
    )
    err.status = 0
    err.networkError = true
    throw err
  }

  let payload
  try {
    payload = await res.json()
  } catch {
    payload = { ok: false, error: res.statusText || 'Request failed' }
  }

  if (!res.ok || payload.ok === false) {
    const err = new Error(payload.error || 'Request failed')
    err.status = res.status
    throw err
  }

  return payload.data
}
