import type { RoomMap } from './officeMap'

/** The player's feet box, centred on the feet point: 10 px wide, 6 px deep. */
export const FOOT_HALF_W = 5
export const FOOT_DEPTH = 6

export function tileWalkable(map: RoomMap, tx: number, ty: number): boolean {
  if (ty < 0 || ty >= map.walkable.length || tx < 0 || tx >= map.walkable[ty].length) return false
  return map.walkable[ty][tx] === '1'
}

/** True when the feet box overlaps a prop footprint with `blocks: true` (touching edges do not count). */
export function hitsProp(map: RoomMap, x: number, y: number, halfW = FOOT_HALF_W, depth = FOOT_DEPTH): boolean {
  const t = map.grid.tile
  const l = x - halfW, r = x + halfW, top = y - depth, bottom = y
  return map.props.some((p) => {
    if (!p.blocks) return false
    return l < (p.x + p.w) * t && r > p.x * t && top < (p.y + p.h) * t && bottom > p.y * t
  })
}

export interface StandOptions {
  /** also test prop footprints (the player does; floating monsters only use the tile grid) */
  props?: boolean
  halfW?: number
  depth?: number
}

/** Can a body with its feet at pixel (x, y) stand here? Every corner of the feet box must be on a walkable tile. */
export function canStand(map: RoomMap, x: number, y: number, o: StandOptions = {}): boolean {
  const t = map.grid.tile
  const halfW = o.halfW ?? FOOT_HALF_W
  const depth = o.depth ?? FOOT_DEPTH
  for (const cx of [x - halfW, x + halfW - 0.01]) for (const cy of [y - depth, y - 0.01]) {
    if (!tileWalkable(map, Math.floor(cx / t), Math.floor(cy / t))) return false
  }
  if (o.props !== false && hitsProp(map, x, y, halfW, depth)) return false
  return true
}

/** Moves by (dx, dy), one axis at a time so the body slides along walls. */
export function moveWithCollision(
  map: RoomMap, x: number, y: number, dx: number, dy: number, o: StandOptions = {}
): { x: number; y: number } {
  let nx = x, ny = y
  if (dx !== 0 && canStand(map, x + dx, y, o)) nx = x + dx
  if (dy !== 0 && canStand(map, nx, y + dy, o)) ny = y + dy
  return { x: nx, y: ny }
}

/** Centre of a tile in pixels, at floor level (feet point). */
export function tileCenter(map: RoomMap, tx: number, ty: number): { x: number; y: number } {
  const t = map.grid.tile
  return { x: tx * t + t / 2, y: ty * t + t / 2 + 4 }
}
