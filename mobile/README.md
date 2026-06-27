# Scan Me

Expo mobile app that scans product barcodes and sends them to the **web POS** on your billing PC — same Wi‑Fi, no separate bridge server.

## How it works

```
Phone (Scan Me)  →  billing PC (npm run dev)  →  POS cart in browser
```

When you run the frontend dev server, it automatically opens a small relay on port **3847**. The phone and browser both connect to that PC.

## Setup

1. **Billing PC** — same Wi‑Fi as your phone:

```bash
cd frontend
npm install
npm run dev
```

2. Open **POS / Billing** in the browser on that PC.

3. **Phone** — open Scan Me (Expo Go or installed APK):

```bash
cd mobile
npm install
npm start
```

4. Tap **PC URL** and set your computer’s LAN address, e.g. `ws://192.168.1.3:3847`.

5. Scan barcodes — items are added to the cart on the PC.

## Find your PC IP

- **macOS:** `ipconfig getifaddr en0` or System Settings → Network
- **Windows:** `ipconfig`

## Notes

- Phone and billing PC must be on the **same Wi‑Fi**.
- The POS page must stay open on the PC (`npm run dev` must be running).
- Products must exist in the store with matching barcodes.
- USB barcode scanners on the PC work independently — no phone needed.

## Build APK

```bash
cd mobile
npm run build:android
```
