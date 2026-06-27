let audioCtx = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) audioCtx = new Ctx()
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

function playTone(ctx, { start, freq, duration, type = 'square', peak = 0.09 }) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()

  osc.type = type
  osc.frequency.setValueAtTime(freq, start)

  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(3200, start)
  filter.Q.setValueAtTime(0.7, start)

  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

/** Retail scanner-style beep when a product is added to the POS bill. */
export function playPosAddSound() {
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  // Quick double beep — common supermarket / barcode scanner feedback
  playTone(ctx, { start: now, freq: 1960, duration: 0.035, peak: 0.1 })
  playTone(ctx, { start: now + 0.048, freq: 2620, duration: 0.04, peak: 0.08 })
}
