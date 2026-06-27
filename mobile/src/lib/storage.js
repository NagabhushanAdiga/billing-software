import AsyncStorage from '@react-native-async-storage/async-storage'
import { getSuggestedRelayUrl } from './relayUrl'

const RELAY_URL_KEY = 'billing_scanner_relay_url'

export async function loadRelayUrl() {
  const suggested = getSuggestedRelayUrl()
  try {
    const saved = await AsyncStorage.getItem(RELAY_URL_KEY)
    if (!saved) return suggested
    if (saved.includes('192.168.1.100') && suggested !== saved) {
      return suggested
    }
    return saved
  } catch {
    return suggested
  }
}

export async function saveRelayUrl(url) {
  await AsyncStorage.setItem(RELAY_URL_KEY, url.trim())
}

export { getSuggestedRelayUrl } from './relayUrl'
