import Constants from 'expo-constants'

export const RELAY_PORT = 3847

function getDevServerHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost

  if (!hostUri) return null
  return String(hostUri).split(':')[0]
}

/** Same LAN IP as the Expo dev server / billing PC. */
export function getSuggestedRelayUrl() {
  const host = getDevServerHost()
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `ws://${host}:${RELAY_PORT}`
  }
  return `ws://192.168.1.3:${RELAY_PORT}`
}
