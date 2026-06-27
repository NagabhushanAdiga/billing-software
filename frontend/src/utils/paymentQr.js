import QRCode from 'qrcode'

/** Build UPI deep-link for scan-to-pay on the bill. */
export function buildUpiPaymentUrl(settings, order) {
  const upi = String(settings?.storeUpiId || '').trim()
  if (!upi) return null

  const params = new URLSearchParams()
  params.set('pa', upi)
  params.set('pn', String(settings?.storeName || 'Store').slice(0, 50))
  params.set('am', Number(order?.total || 0).toFixed(2))
  params.set('cu', 'INR')
  if (order?.id) params.set('tn', `Bill ${order.id}`)

  return `upi://pay?${params.toString()}`
}

export async function generatePaymentQrDataUrl(paymentUrl) {
  if (!paymentUrl) return null
  try {
    return await QRCode.toDataURL(paymentUrl, {
      width: 180,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' },
    })
  } catch {
    return null
  }
}
