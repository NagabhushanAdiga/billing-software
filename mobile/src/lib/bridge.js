/**
 * WebSocket client for the scanner bridge (same protocol as web POS).
 */
export function createScannerBridgeClient(url, handlers = {}) {
  let ws = null
  let disposed = false
  let retryTimer = null

  const connect = () => {
    if (disposed) return
    ws = new WebSocket(url)

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'register', role: 'scanner' }))
      handlers.onOpen?.()
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'registered') {
          handlers.onRegistered?.(msg)
        } else if (msg.type === 'status') {
          handlers.onStatus?.(msg)
        } else if (msg.type === 'ack') {
          handlers.onAck?.(msg)
        } else if (msg.type === 'pong') {
          handlers.onPong?.()
        }
      } catch {
        // ignore
      }
    }

    ws.onclose = () => {
      handlers.onClose?.()
      if (!disposed) {
        retryTimer = setTimeout(connect, 2500)
      }
    }

    ws.onerror = () => {
      handlers.onError?.()
    }
  }

  connect()

  return {
    sendScan(barcode) {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'scan', barcode: String(barcode).trim() }))
        return true
      }
      return false
    },
    close() {
      disposed = true
      if (retryTimer) clearTimeout(retryTimer)
      ws?.close()
      ws = null
    },
    get ready() {
      return ws?.readyState === WebSocket.OPEN
    },
  }
}
