import type { RoomMap } from './officeMap'
import { tileWalkable } from './collision'

type P = { x: number; y: number }

/** Line of sight on the tile grid: no blocked tile between the two pixel points. */
export function lineOfSight(map: RoomMap, a: P, b: P): boolean {
  const t = map.grid.tile
  const steps = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 8))
  for (let i = 0; i <= steps; i++) {
    const k = i / steps
    const x = a.x + (b.x - a.x) * k
    const y = a.y + (b.y - a.y) * k - 6 // test at body height, not at the feet
    if (!tileWalkable(map, Math.floor(x / t), Math.floor(y / t))) return false
  }
  return true
}

/**
 * Next pixel target for walking from `from` to `to` over walkable tiles (BFS, 4-neighbour).
 * Returns `to` when the straight line is clear, the centre of the next tile on the path otherwise,
 * or null when no path exists.
 */
export function nextStep(map: RoomMap, from: P, to: P): P | null {
  const t = map.grid.tile
  if (lineOfSight(map, from, to)) return to
  const sx = Math.floor(from.x / t), sy = Math.floor((from.y - 4) / t)
  const gx = Math.floor(to.x / t), gy = Math.floor((to.y - 4) / t)
  const key = (x: number, y: number) => y * 1000 + x
  const prev = new Map<number, number>()
  prev.set(key(sx, sy), -1)
  const queue: [number, number][] = [[sx, sy]]
  let found = false
  while (queue.length) {
    const [x, y] = queue.shift()!
    if (x === gx && y === gy) { found = true; break }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy
      if (!tileWalkable(map, nx, ny) || prev.has(key(nx, ny))) continue
      prev.set(key(nx, ny), key(x, y))
      queue.push([nx, ny])
    }
  }
  if (!found) return null
  // walk back to the tile after the start
  let cur = key(gx, gy)
  let step = cur
  while (prev.get(cur) !== -1) { step = cur; cur = prev.get(cur)! }
  if (step === key(sx, sy)) return to
  const tx = step % 1000, ty = Math.floor(step / 1000)
  return { x: tx * t + t / 2, y: ty * t + t / 2 + 4 }
}
