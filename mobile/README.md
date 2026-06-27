# SuperMart Mobile Scanner

Expo app that uses your phone camera to scan product barcodes and send them to the **web POS billing screen** — like a wireless hardware scanner.

## How it works

```
Phone (this app)  →  scanner-bridge (WebSocket)  →  Web POS cart
```

1. Start the bridge server on your computer (`../scanner-bridge`).
2. Open **POS / Billing** in the browser on the same computer.
3. Open this app on your phone (same Wi‑Fi).
4. Set the bridge URL to your computer's LAN IP, e.g. `ws://192.168.1.5:3847`.
5. Scan barcodes — items are added to the cart automatically.

## Setup

Requires **Expo Go SDK 54** (update from App Store / Play Store if needed).

```bash
cd mobile
npm install
npm start
```

Then press **i** (iOS simulator), **a** (Android emulator), or scan the QR code with **Expo Go** on a physical device.

### Bridge server (required)

In a separate terminal:

```bash
cd ../scanner-bridge
npm install
npm start
```

Find your computer's local IP:

- **macOS:** System Settings → Network, or `ipconfig getifaddr en0`
- **Windows:** `ipconfig`

Use that IP in the mobile app **Server** settings, e.g. `ws://192.168.1.5:3847`.

## Features

- Camera barcode scanning (EAN, UPC, Code128, QR, etc.)
- Live connection status (bridge + POS)
- Scan cooldown to avoid duplicate adds
- Haptic feedback on each scan
- Pause / resume scanning

## Notes

- The phone and PC must be on the **same network**.
- The web POS must stay open on the billing page.
- Products must already exist in the store with matching barcodes.
