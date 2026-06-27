import Constants from 'expo-constants'

export const BRIDGE_PORT = 3847

function getDevServerHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost

  if (!hostUri) return null
  return String(hostUri).split(':')[0]
}

/** Best guess for ws:// address — same LAN IP as the Expo dev server on your PC. */
export function getSuggestedBridgeUrl() {
  const host = getDevServerHost()
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `ws://${host}:${BRIDGE_PORT}`
  }
  return `ws://192.168.1.3:${BRIDGE_PORT}`
}
