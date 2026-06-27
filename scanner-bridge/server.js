/**
 * Relays barcode scans from the Expo mobile app to the web POS.
 * Run on the same machine as the browser, or on a LAN-accessible host.
 *
 *   npm start          (default port 3847)
 *   PORT=4000 npm start
 */
const { WebSocketServer } = require('ws')

const PORT = Number(process.env.PORT) || 3847
const wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' })

const posClients = new Set()
const scannerClients = new Set()

function send(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload))
  }
}

function broadcastStatus() {
  const status = {
    type: 'status',
    posConnected: posClients.size > 0,
    scannerCount: scannerClients.size,
  }
  for (const client of [...posClients, ...scannerClients]) {
    send(client, status)
  }
}

function log(...args) {
  console.log('[scanner-bridge]', ...args)
}

wss.on('connection', (ws) => {
  ws.role = null

  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(String(raw))
    } catch {
      return
    }

    if (msg.type === 'register' && (msg.role === 'pos' || msg.role === 'scanner')) {
      ws.role = msg.role
      if (msg.role === 'pos') posClients.add(ws)
      if (msg.role === 'scanner') scannerClients.add(ws)
      send(ws, { type: 'registered', role: msg.role })
      log(`${msg.role} connected (${msg.role === 'pos' ? posClients.size : scannerClients.size} total)`)
      broadcastStatus()
      return
    }

    if (msg.type === 'scan' && ws.role === 'scanner') {
      const barcode = String(msg.barcode || '').trim()
      if (!barcode) return

      let delivered = 0
      for (const pos of posClients) {
        send(pos, { type: 'scan', barcode, source: 'mobile' })
        delivered += 1
      }

      send(ws, {
        type: 'ack',
        barcode,
        delivered,
        ok: delivered > 0,
      })

      log(`scan ${barcode} → ${delivered} POS client(s)`)
      return
    }

    if (msg.type === 'ping') {
      send(ws, { type: 'pong' })
    }
  })

  ws.on('close', () => {
    if (ws.role === 'pos') posClients.delete(ws)
    if (ws.role === 'scanner') scannerClients.delete(ws)
    if (ws.role) {
      log(`${ws.role} disconnected`)
      broadcastStatus()
    }
  })
})

log(`listening on ws://0.0.0.0:${PORT}`)
log('Point the web POS and mobile app at this address (use your PC LAN IP on a phone).')
