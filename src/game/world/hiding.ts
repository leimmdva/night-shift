import type { HideSpot, RoomMap } from './officeMap'

export type PlayerMode = 'walking' | 'hidden'

/** Interact radius around a hide spot's `enter` tile, in tiles. Prompt and interaction share it. */
export const HIDE_REACH_TILES = 1

/** The hide spot whose `enter` tile is within reach of the feet point (px), nearest first. */
export function nearestHideSpot(map: RoomMap, x: number, y: number, reach = HIDE_REACH_TILES): HideSpot | null {
  const t = map.grid.tile
  let best: HideSpot | null = null
  let bestD = Infinity
  for (const h of map.hideSpots) {
    const d = Math.hypot(x / t - (h.enter.x + 0.5), (y - 4) / t - (h.enter.y + 0.5))
    if (d <= reach && d < bestD) { best = h; bestD = d }
  }
  return best
}

/** Game-flow rule: the laptop opens only while hidden, and only when a monster is active. */
export function canOpenLaptop(mode: PlayerMode, monsterActive: boolean): boolean {
  return mode === 'hidden' && monsterActive
}

/** Game-flow rule: a hidden player (laptop open or closed) is never caught. */
export function isCatchable(mode: PlayerMode): boolean {
  return mode === 'walking'
}

/** Interact key: enter the nearby spot when walking, leave when hidden with the laptop closed. */
export function interactResult(
  mode: PlayerMode, laptopOpen: boolean, nearby: HideSpot | null
): 'hide' | 'leave' | 'none' {
  if (mode === 'walking') return nearby ? 'hide' : 'none'
  return laptopOpen ? 'none' : 'leave'
}

/** Nearest hide spot to a tile (used for the checkpoint after a solve). */
export function nearestSpotToTile(map: RoomMap, tx: number, ty: number): HideSpot {
  return [...map.hideSpots].sort(
    (a, b) => Math.hypot(a.x - tx, a.y - ty) - Math.hypot(b.x - tx, b.y - ty)
  )[0]
}
