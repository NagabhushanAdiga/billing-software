import AsyncStorage from '@react-native-async-storage/async-storage'
import { getSuggestedBridgeUrl } from './bridgeUrl'

const BRIDGE_URL_KEY = 'billing_scanner_bridge_url'

export async function loadBridgeUrl() {
  const suggested = getSuggestedBridgeUrl()
  try {
    const saved = await AsyncStorage.getItem(BRIDGE_URL_KEY)
    if (!saved) return suggested
    // Upgrade old placeholder IP to the PC detected from Expo dev server
    if (saved.includes('192.168.1.100') && suggested !== saved) {
      return suggested
    }
    return saved
  } catch {
    return suggested
  }
}

export async function saveBridgeUrl(url) {
  await AsyncStorage.setItem(BRIDGE_URL_KEY, url.trim())
}

export { getSuggestedBridgeUrl } from './bridgeUrl'
