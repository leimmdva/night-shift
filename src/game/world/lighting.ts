/**
 * lighting.ts — the "lights on" look of the office (same formula as lightsOn() in scripts/sprites/office-compose.mjs):
 * a warm multiply tint plus banded pools of light under the ceiling lamps.
 */
export const LAMPS: [number, number][] = []
for (const x of [112, 288, 464, 592]) for (const y of [138, 322]) LAMPS.push([x, y])

/** 0 = outside every pool, 1–3 = outer to inner band. */
export function lightBand(x: number, y: number): number {
  let band = 0
  for (const [lx, ly] of LAMPS) {
    const d = Math.hypot((x - lx) / 92, (y - ly) / 58)
    band = Math.max(band, d < 0.45 ? 3 : d < 0.75 ? 2 : d < 1 ? 1 : 0)
  }
  return band
}

export const BAND_STRENGTH = [0, 0.04, 0.08, 0.12]
