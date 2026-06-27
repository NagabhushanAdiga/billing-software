import { useEffect, useRef, useState, useCallback } from 'react'

const DEFAULT_PORT = 3847

function resolveBridgeUrl(explicitUrl) {
  if (explicitUrl) return explicitUrl
  if (import.meta.env.VITE_SCANNER_BRIDGE_URL) {
    return import.meta.env.VITE_SCANNER_BRIDGE_URL
  }
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${host}:${DEFAULT_PORT}`
}

/**
 * Connects the web POS to the scanner bridge so mobile camera scans
 * are delivered like a hardware barcode scanner.
 */
export function useMobileScannerBridge(onScan, { active = true, url } = {}) {
  const onScanRef = useRef(onScan)
  const [status, setStatus] = useState({
    connected: false,
    bridgeReachable: false,
    scannerCount: 0,
    url: '',
  })

  onScanRef.current = onScan

  const reconnect = useCallback(() => {
    setStatus((prev) => ({ ...prev, connected: false }))
  }, [])

  useEffect(() => {
    if (!active) {
      setStatus((prev) => ({ ...prev, connected: false, bridgeReachable: false, scannerCount: 0 }))
      return undefined
    }

    const bridgeUrl = resolveBridgeUrl(url)
    let ws
    let disposed = false
    let retryTimer

    const connect = () => {
      if (disposed) return
      ws = new WebSocket(bridgeUrl)

      ws.onopen = () => {
        if (disposed) return
        ws.send(JSON.stringify({ type: 'register', role: 'pos' }))
        setStatus((prev) => ({
          ...prev,
          connected: true,
          bridgeReachable: true,
          url: bridgeUrl,
        }))
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'scan' && msg.barcode) {
            onScanRef.current?.(String(msg.barcode))
            return
          }
          if (msg.type === 'status') {
            setStatus((prev) => ({
              ...prev,
              bridgeReachable: true,
              scannerCount: Number(msg.scannerCount) || 0,
            }))
          }
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = () => {
        if (disposed) return
        setStatus((prev) => ({
          ...prev,
          connected: false,
          scannerCount: 0,
          url: bridgeUrl,
        }))
        retryTimer = window.setTimeout(connect, 2500)
      }

      ws.onerror = () => {
        setStatus((prev) => ({
          ...prev,
          connected: false,
          bridgeReachable: false,
          url: bridgeUrl,
        }))
      }
    }

    setStatus((prev) => ({ ...prev, url: bridgeUrl }))
    connect()

    return () => {
      disposed = true
      window.clearTimeout(retryTimer)
      ws?.close()
    }
  }, [active, url])

  return { status, reconnect }
}
