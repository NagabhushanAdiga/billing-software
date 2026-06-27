import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  loadAuditLog,
  logAudit as writeAudit,
  clearAuditLog as wipeAudit,
  subscribeAuditLog,
} from '../utils/auditLog'

const AuditContext = createContext(null)

export function AuditProvider({ children }) {
  const [entries, setEntries] = useState(loadAuditLog)

  useEffect(() => subscribeAuditLog(setEntries), [])

  const logAudit = useCallback((action, opts) => writeAudit(action, opts), [])
  const clearAuditLog = useCallback(() => wipeAudit(), [])

  return (
    <AuditContext.Provider value={{ entries, logAudit, clearAuditLog }}>
      {children}
    </AuditContext.Provider>
  )
}

export function useAudit() {
  const ctx = useContext(AuditContext)
  if (!ctx) throw new Error('useAudit must be used within AuditProvider')
  return ctx
}
