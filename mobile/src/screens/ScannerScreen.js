import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import { createScannerClient } from '../lib/bridge'
import { getSuggestedRelayUrl, loadRelayUrl, saveRelayUrl } from '../lib/storage'

const SCAN_COOLDOWN_MS = 1200

function StatusPill({ label, tone = 'neutral' }) {
  const tones = {
    neutral: { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
    ok: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
    warn: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
    bad: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  }
  const colors = tones[tone] || tones.neutral

  return (
    <View style={[styles.pill, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.pillText, { color: colors.text }]}>{label}</Text>
    </View>
  )
}

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [relayUrl, setRelayUrl] = useState(() => getSuggestedRelayUrl())
  const [draftUrl, setDraftUrl] = useState(() => getSuggestedRelayUrl())
  const [suggestedUrl, setSuggestedUrl] = useState(() => getSuggestedRelayUrl())
  const [showSettings, setShowSettings] = useState(false)
  const [connected, setConnected] = useState(false)
  const [posOnline, setPosOnline] = useState(false)
  const [lastScan, setLastScan] = useState(null)
  const [scanningEnabled, setScanningEnabled] = useState(true)
  const bridgeRef = useRef(null)
  const lastScanAtRef = useRef(0)
  const lastBarcodeRef = useRef('')

  useEffect(() => {
    const suggested = getSuggestedRelayUrl()
    setSuggestedUrl(suggested)
    loadRelayUrl().then((url) => {
      setRelayUrl(url)
      setDraftUrl(url)
    })
  }, [])

  useEffect(() => {
    bridgeRef.current?.close()
    bridgeRef.current = null
    setConnected(false)
    setPosOnline(false)

    if (!relayUrl) return undefined

    const client = createScannerClient(relayUrl, {
      onOpen: () => setConnected(true),
      onClose: () => {
        setConnected(false)
        setPosOnline(false)
      },
      onError: () => setConnected(false),
      onStatus: (msg) => setPosOnline(Boolean(msg.posConnected)),
      onAck: (msg) => {
        setLastScan({
          barcode: msg.barcode,
          ok: Boolean(msg.ok),
          at: Date.now(),
        })
      },
    })

    bridgeRef.current = client
    return () => client.close()
  }, [relayUrl])

  const handleBarcodeScanned = useCallback(
    ({ data }) => {
      const barcode = String(data || '').trim()
      if (!barcode || !scanningEnabled) return

      const now = Date.now()
      if (
        barcode === lastBarcodeRef.current &&
        now - lastScanAtRef.current < SCAN_COOLDOWN_MS
      ) {
        return
      }
      lastBarcodeRef.current = barcode
      lastScanAtRef.current = now

      const sent = bridgeRef.current?.sendScan(barcode)
      if (sent) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        setLastScan({ barcode, ok: false, at: now, error: 'Not connected to billing PC' })
      }
    },
    [scanningEnabled]
  )

  const saveSettings = async () => {
    const trimmed = draftUrl.trim()
    if (!trimmed) return
    await saveRelayUrl(trimmed)
    setRelayUrl(trimmed)
    setShowSettings(false)
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#1a8cff" />
      </SafeAreaView>
    )
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <Text style={styles.title}>Camera required</Text>
        <Text style={styles.subtitle}>
          Allow camera access to scan product barcodes.
        </Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Allow camera</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Scan Me</Text>
          <Text style={styles.headerSubtitle}>Scan to add items on the billing PC</Text>
        </View>
        <Pressable style={styles.headerBtn} onPress={() => setShowSettings((v) => !v)}>
          <Text style={styles.headerBtnText}>{showSettings ? 'Close' : 'PC URL'}</Text>
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        <StatusPill
          label={connected ? 'Connected' : 'Not connected'}
          tone={connected ? 'ok' : 'bad'}
        />
        <StatusPill
          label={posOnline ? 'POS open' : 'Open POS on PC'}
          tone={posOnline ? 'ok' : 'warn'}
        />
      </View>

      {!connected || !posOnline ? (
        <View style={styles.offlineCard}>
          <Text style={styles.offlineTitle}>Setup (same Wi‑Fi)</Text>
          <Text style={styles.offlineStep}>1. On billing PC: cd frontend && npm run dev</Text>
          <Text style={styles.offlineStep}>2. Open POS / Billing in the browser on that PC</Text>
          <Text style={styles.offlineStep}>3. Set PC URL below (your PC LAN IP)</Text>
          <Text style={styles.offlineUrl}>{relayUrl || suggestedUrl}</Text>
        </View>
      ) : null}

      {showSettings ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.settingsCard}
        >
          <Text style={styles.settingsTitle}>Billing PC address</Text>
          <Text style={styles.settingsHint}>Example: ws://192.168.1.3:3847</Text>
          <TextInput
            value={draftUrl}
            onChangeText={setDraftUrl}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.urlInput}
          />
          <Pressable style={styles.primaryButton} onPress={saveSettings}>
            <Text style={styles.primaryButtonText}>Save & reconnect</Text>
          </Pressable>
        </KeyboardAvoidingView>
      ) : null}

      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: [
              'ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'codabar', 'itf14', 'qr',
            ],
          }}
          onBarcodeScanned={scanningEnabled ? handleBarcodeScanned : undefined}
        />
        <View style={styles.cameraOverlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>Align barcode inside the frame</Text>
        </View>
      </View>

      <ScrollView style={styles.footer} contentContainerStyle={styles.footerContent}>
        {lastScan ? (
          <View style={[styles.lastScanCard, lastScan.ok ? styles.lastScanOk : styles.lastScanBad]}>
            <Text style={styles.lastScanLabel}>{lastScan.ok ? 'Added to bill' : 'Could not send'}</Text>
            <Text style={styles.lastScanBarcode}>{lastScan.barcode}</Text>
            {lastScan.error ? <Text style={styles.lastScanError}>{lastScan.error}</Text> : null}
          </View>
        ) : (
          <Text style={styles.footerHint}>
            Scan items to add them to the POS cart on your billing computer.
          </Text>
        )}

        <Pressable
          style={[styles.secondaryButton, !scanningEnabled && styles.secondaryButtonActive]}
          onPress={() => setScanningEnabled((v) => !v)}
        >
          <Text style={styles.secondaryButtonText}>
            {scanningEnabled ? 'Pause scanning' : 'Resume scanning'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0c4a9e' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  permissionScreen: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  subtitle: { fontSize: 16, lineHeight: 24, color: '#64748b', marginBottom: 24 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  headerText: { flex: 1, minWidth: 0 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSubtitle: { color: '#bfdbfe', fontSize: 13, marginTop: 2 },
  headerBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  headerBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  statusRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  offlineCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  offlineTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  offlineStep: { color: '#cbd5e1', fontSize: 13 },
  offlineUrl: {
    color: '#86efac',
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    marginTop: 4,
  },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontSize: 12, fontWeight: '700' },
  settingsCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  settingsTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  settingsHint: { fontSize: 12, color: '#64748b' },
  urlInput: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  cameraWrap: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    minHeight: 280,
  },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanFrame: {
    width: '78%',
    height: '42%',
    borderWidth: 3,
    borderColor: '#60a5fa',
    borderRadius: 16,
    backgroundColor: 'rgba(37,99,235,0.12)',
  },
  scanHint: {
    position: 'absolute',
    bottom: 18,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(15,23,42,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  footer: { maxHeight: 180 },
  footerContent: { padding: 20, gap: 12 },
  footerHint: { color: '#cbd5e1', fontSize: 13, lineHeight: 20 },
  lastScanCard: { borderRadius: 12, padding: 14, borderWidth: 1 },
  lastScanOk: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  lastScanBad: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  lastScanLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 },
  lastScanBarcode: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  lastScanError: { marginTop: 4, fontSize: 12, color: '#b91c1c' },
  primaryButton: {
    backgroundColor: '#1a8cff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#475569',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.12)' },
  secondaryButtonText: { color: '#e2e8f0', fontWeight: '700' },
})
