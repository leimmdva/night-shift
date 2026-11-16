/**
 * cues.ts — tiny Web Audio cues. The full synthesised SFX set (footsteps, test pass/fail, monster signatures)
 * comes with milestone 6; this file only holds the cues the slice needs.
 */
let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function blip(freq: number, ms: number, type: OscillatorType, gain: number, slideTo?: number): void {
  const a = audio()
  if (!a) return
  const t = a.currentTime
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + ms / 1000)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000)
  o.connect(g).connect(a.destination)
  o.start(t)
  o.stop(t + ms / 1000)
}

/** Dull short thud: the laptop key does nothing outside a hide spot. */
export const lockedCue = (): void => blip(140, 120, 'square', 0.05, 90)
export const passCue = (): void => { blip(523, 120, 'square', 0.05); setTimeout(() => blip(784, 200, 'square', 0.05), 110) }
export const failCue = (): void => blip(220, 260, 'sawtooth', 0.05, 110)
export const caughtCue = (): void => blip(300, 400, 'sawtooth', 0.07, 60)
