export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function parseJson(value, fallback = null) {
  if (value == null || value === '') return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function toPublicUser(row) {
  if (!row) return null
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
  }
}
