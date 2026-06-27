# Scanner Bridge

Small WebSocket server that relays barcode scans from the **mobile scanner app** to the **web POS**.

## Run

```bash
npm install
npm start
```

Default URL: `ws://localhost:3847` (listens on all interfaces `0.0.0.0`).

Custom port:

```bash
PORT=4000 npm start
```

## Clients

| Role | App | Registers as |
|------|-----|--------------|
| POS | Web billing page | `pos` |
| Scanner | Expo mobile app | `scanner` |

When a scanner sends `{ "type": "scan", "barcode": "..." }`, the bridge forwards it to all connected POS clients.

## Frontend config

Optional env in `frontend/.env`:

```
VITE_SCANNER_BRIDGE_URL=ws://localhost:3847
```

If unset, the POS uses `ws://<current-hostname>:3847`.
