import { describe, it, expect, vi } from 'vitest'
import fc from 'fast-check'
import { officeMap } from '../../world/officeMap'
import { pickSpawns, distanceToDesk, firstSpawnDelay } from '../spawner'

describe('pickSpawns', () => {
  it('only returns spawns at least 6 tiles from the desk', () => {
    const picked = pickSpawns(officeMap, { x: 2, y: 12 }, 4)
    expect(picked.length).toBeGreaterThan(0)
    for (const s of picked) expect(distanceToDesk(officeMap, s)).toBeGreaterThanOrEqual(6)
  })
  it('prefers the spawn farthest from the player', () => {
    const [s] = pickSpawns(officeMap, { x: 1, y: 4 }, 1)
    expect(s).toEqual({ x: 9, y: 12 })
  })
  it('returns two different spawns for a pair', () => {
    const [a, b] = pickSpawns(officeMap, { x: 2, y: 12 }, 2)
    expect(a).not.toEqual(b)
  })
  it('falls back to the spawns farthest from the desk when none passes the filter', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const map = { ...officeMap, monsterSpawns: [{ x: 14, y: 7 }, { x: 12, y: 7 }] }
    expect(pickSpawns(map, { x: 0, y: 0 }, 1)).toEqual([{ x: 12, y: 7 }])
  })
  it('never returns a spawn within 6 tiles of the desk, for any player position', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 19 }), fc.integer({ min: 0, max: 13 }), fc.integer({ min: 1, max: 4 }), (x, y, n) => {
        return pickSpawns(officeMap, { x, y }, n).every((s) => distanceToDesk(officeMap, s) >= 6)
      })
    )
  })
})

describe('firstSpawnDelay', () => {
  it('stays within 20–40 s', () => {
    expect(firstSpawnDelay(() => 0)).toBe(20_000)
    expect(firstSpawnDelay(() => 1)).toBe(40_000)
  })
})
