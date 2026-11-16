import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { officeMap as map } from '../officeMap'
import { canStand, moveWithCollision, tileCenter } from '../collision'
import { nearestHideSpot, canOpenLaptop, isCatchable, interactResult } from '../hiding'
import { nextStep, lineOfSight } from '../nav'

const spawn = tileCenter(map, map.entrance.spawn.x, map.entrance.spawn.y)
const tile = (tx: number, ty: number) => tileCenter(map, tx, ty)

describe('canStand', () => {
  it('allows the entrance spawn', () => {
    expect(canStand(map, spawn.x, spawn.y)).toBe(true)
  })
  it('blocks the back wall, the fridge, the counter and the player desk', () => {
    expect(canStand(map, 320, 60)).toBe(false)
    expect(canStand(map, 16, 3.4 * 32)).toBe(false) // fridge footprint
    expect(canStand(map, 70, 3.4 * 32)).toBe(false) // counter footprint
    expect(canStand(map, 15.5 * 32, 7.5 * 32)).toBe(false) // desk-player
  })
  it('blocks the map border', () => {
    expect(canStand(map, 3, 200)).toBe(false)
    expect(canStand(map, 637, 200)).toBe(false)
  })
  it('allows every hide spot enter tile', () => {
    for (const h of map.hideSpots) {
      const c = tile(h.enter.x, h.enter.y)
      expect(canStand(map, c.x, c.y), h.id).toBe(true)
    }
  })
})

describe('moveWithCollision', () => {
  it('slides along a wall instead of stopping', () => {
    const s = tile(2, 4)
    const r = moveWithCollision(map, s.x, s.y, 3, -40)
    expect(r.x).toBe(s.x + 3)
  })
  it('never ends on a blocked point (property)', () => {
    fc.assert(fc.property(fc.integer({ min: -20, max: 20 }), fc.integer({ min: -20, max: 20 }), (dx, dy) => {
      const r = moveWithCollision(map, spawn.x, spawn.y, dx, dy)
      return canStand(map, r.x, r.y)
    }))
  })
})

describe('reachability', () => {
  it('every hide spot enter tile can be walked to from the entrance with the real collision box', () => {
    const step = 4
    const key = (x: number, y: number) => `${x},${y}`
    const seen = new Set([key(Math.round(spawn.x / step), Math.round(spawn.y / step))])
    const q: [number, number][] = [[Math.round(spawn.x / step), Math.round(spawn.y / step)]]
    while (q.length) {
      const [gx, gy] = q.shift()!
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = gx + dx, ny = gy + dy
        if (seen.has(key(nx, ny)) || !canStand(map, nx * step, ny * step)) continue
        seen.add(key(nx, ny)); q.push([nx, ny])
      }
    }
    for (const h of map.hideSpots) {
      const c = tile(h.enter.x, h.enter.y)
      expect(seen.has(key(Math.round(c.x / step), Math.round(c.y / step))), h.id).toBe(true)
    }
  })
})

describe('hide spot detection', () => {
  it('finds the locker from its enter tile and from one tile away', () => {
    const locker = map.hideSpots.find((h) => h.id === 'locker')!
    const c = tile(locker.enter.x, locker.enter.y)
    expect(nearestHideSpot(map, c.x, c.y)?.id).toBe('locker')
    expect(nearestHideSpot(map, c.x + 30, c.y)?.id).toBe('locker')
  })
  it('finds nothing farther than one tile from every enter tile', () => {
    const c = tile(2, 12)
    expect(nearestHideSpot(map, c.x, c.y)).toBeNull()
  })
})

describe('laptop and catch rules', () => {
  it('the laptop opens only while hidden with an active monster', () => {
    expect(canOpenLaptop('walking', true)).toBe(false)
    expect(canOpenLaptop('hidden', false)).toBe(false)
    expect(canOpenLaptop('hidden', true)).toBe(true)
  })
  it('a hidden player is never catchable', () => {
    expect(isCatchable('hidden')).toBe(false)
    expect(isCatchable('walking')).toBe(true)
  })
  it('interact hides when near a spot, leaves when hidden, and is ignored while the laptop is open', () => {
    const spot = map.hideSpots[0]
    expect(interactResult('walking', false, spot)).toBe('hide')
    expect(interactResult('walking', false, null)).toBe('none')
    expect(interactResult('hidden', false, null)).toBe('leave')
    expect(interactResult('hidden', true, null)).toBe('none')
  })
})

describe('nav', () => {
  it('sees through open floor and not through the back wall', () => {
    expect(lineOfSight(map, tile(2, 10), tile(8, 10))).toBe(true)
    expect(lineOfSight(map, tile(5, 4), { x: 160, y: 40 })).toBe(false)
  })
  it('routes around an obstacle with a tile target', () => {
    const a = tile(1, 12), b = tile(9, 4)
    const s = nextStep(map, a, b)
    expect(s).not.toBeNull()
  })
})
