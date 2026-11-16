import type { RoomMap, TilePos } from '../world/officeMap'

export const MIN_DESK_DISTANCE = 6

/** Distance in tiles from a tile to the nearest tile of the player's desk. */
export function distanceToDesk(map: RoomMap, p: TilePos): number {
  const d = map.playerDesk
  let best = Infinity
  for (let dy = 0; dy < d.h; dy++) for (let dx = 0; dx < d.w; dx++) {
    best = Math.min(best, Math.hypot(p.x - (d.x + dx), p.y - (d.y + dy)))
  }
  return best
}

/**
 * Picks `count` monster spawns (game-flow design, "Queue and spawner"):
 * 1. drop spawns closer than 6 tiles to the nearest desk tile,
 * 2. sort the rest by distance from the player, farthest first,
 * 3. if nothing is left, fall back to the spawns farthest from the desk.
 */
export function pickSpawns(map: RoomMap, playerTile: TilePos, count = 1): TilePos[] {
  const far = map.monsterSpawns.filter((s) => distanceToDesk(map, s) >= MIN_DESK_DISTANCE)
  if (far.length > 0) {
    return [...far]
      .sort((a, b) => Math.hypot(b.x - playerTile.x, b.y - playerTile.y) - Math.hypot(a.x - playerTile.x, a.y - playerTile.y))
      .slice(0, count)
  }
  console.warn('pickSpawns: no spawn is 6 tiles from the desk, using the farthest ones')
  return [...map.monsterSpawns].sort((a, b) => distanceToDesk(map, b) - distanceToDesk(map, a)).slice(0, count)
}

/** Delay before the first monster, in ms (20–40 s after the player gains control). */
export const FIRST_SPAWN_MIN_MS = 20_000
export const FIRST_SPAWN_MAX_MS = 40_000

export function firstSpawnDelay(rand: () => number = Math.random): number {
  return FIRST_SPAWN_MIN_MS + rand() * (FIRST_SPAWN_MAX_MS - FIRST_SPAWN_MIN_MS)
}
