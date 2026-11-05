import { describe, it, expect } from 'vitest'
import {
  isInViewCone,
  overshootTarget,
  closedLoopNext,
  shouldTeleport,
  memoryLeechGrow,
  memoryLeechRadius,
  flankTargets,
  deadlockFacingAngle,
} from '../behaviourUtils'

// ── 1. Null Ghost — isInViewCone ──────────────────────────────────────────

describe('isInViewCone', () => {
  const origin = { x: 0, y: 0 }
  const halfFov = Math.PI / 4 // 45°

  it('returns true when target is directly ahead', () => {
    // facing right (angle 0), target to the right
    expect(isInViewCone(origin, 0, halfFov, { x: 10, y: 0 })).toBe(true)
  })

  it('returns true when target is within the cone', () => {
    // facing right, target slightly above — within 45°
    expect(isInViewCone(origin, 0, halfFov, { x: 10, y: 5 })).toBe(true)
  })

  it('returns false when target is behind', () => {
    // facing right, target directly behind
    expect(isInViewCone(origin, 0, halfFov, { x: -10, y: 0 })).toBe(false)
  })

  it('returns false when target is outside cone angle', () => {
    // facing right, target directly above (90° off) — outside 45° half-fov
    expect(isInViewCone(origin, 0, halfFov, { x: 0, y: 10 })).toBe(false)
  })

  it('returns true when origin equals target', () => {
    expect(isInViewCone(origin, 0, halfFov, { x: 0, y: 0 })).toBe(true)
  })
})

// ── 2. Off-by-One — overshootTarget ──────────────────────────────────────

describe('overshootTarget', () => {
  it('overshoots by exactly the given px along the travel vector', () => {
    const result = overshootTarget({ x: 0, y: 0 }, { x: 100, y: 0 }, 32)
    expect(result.x).toBeCloseTo(132)
    expect(result.y).toBeCloseTo(0)
  })

  it('works on a diagonal path', () => {
    const from = { x: 0, y: 0 }
    const to = { x: 100, y: 100 }
    const result = overshootTarget(from, to, 32)
    // Direction is 45°, so overshoot adds ~22.6 to each axis
    const expected = 100 + 32 / Math.SQRT2
    expect(result.x).toBeCloseTo(expected, 1)
    expect(result.y).toBeCloseTo(expected, 1)
  })

  it('clamps to wall boundary when overshoot exceeds it', () => {
    const boundary = { minX: 0, maxX: 120, minY: 0, maxY: 500 }
    const result = overshootTarget({ x: 0, y: 0 }, { x: 100, y: 0 }, 32, boundary)
    expect(result.x).toBe(120) // clamped from 132
  })

  it('returns the target itself when from equals to', () => {
    const result = overshootTarget({ x: 50, y: 50 }, { x: 50, y: 50 }, 32)
    expect(result.x).toBe(50)
    expect(result.y).toBe(50)
  })
})

// ── 3. Infinite Crawler — closedLoopNext ─────────────────────────────────

describe('closedLoopNext', () => {
  const waypoints = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ]

  it('advances to the next index normally', () => {
    expect(closedLoopNext(waypoints, 0)).toBe(1)
    expect(closedLoopNext(waypoints, 2)).toBe(3)
  })

  it('wraps from last back to first (closed loop)', () => {
    expect(closedLoopNext(waypoints, 3)).toBe(0)
  })

  it('handles a single-waypoint list without throwing', () => {
    expect(closedLoopNext([{ x: 0, y: 0 }], 0)).toBe(0)
  })

  it('returns 0 for an empty list', () => {
    expect(closedLoopNext([], 0)).toBe(0)
  })
})

// ── 4. Async Phantom — shouldTeleport ────────────────────────────────────

describe('shouldTeleport', () => {
  it('returns false before the interval elapses', () => {
    expect(shouldTeleport(1000, 2000, 1500)).toBe(false)
  })

  it('returns true exactly at the interval', () => {
    expect(shouldTeleport(1000, 2500, 1500)).toBe(true)
  })

  it('returns true after the interval has passed', () => {
    expect(shouldTeleport(1000, 3000, 1500)).toBe(true)
  })

  it('returns false at time zero', () => {
    expect(shouldTeleport(0, 0, 1500)).toBe(false)
  })
})

// ── 5. Memory Leech — growth and radius ──────────────────────────────────

describe('memoryLeechGrow', () => {
  it('increases scale by the given amount', () => {
    expect(memoryLeechGrow(1.0, 0.1, 1.5)).toBeCloseTo(1.1)
  })

  it('caps at capScale', () => {
    expect(memoryLeechGrow(1.4, 0.1, 1.5)).toBeCloseTo(1.5)
    expect(memoryLeechGrow(1.5, 0.1, 1.5)).toBeCloseTo(1.5)
  })

  it('never exceeds the cap even with a large growAmount', () => {
    expect(memoryLeechGrow(1.0, 5.0, 1.5)).toBeCloseTo(1.5)
  })
})

describe('memoryLeechRadius', () => {
  it('returns baseRadius at scale 1.0', () => {
    expect(memoryLeechRadius(150, 1.0)).toBe(150)
  })

  it('scales linearly', () => {
    expect(memoryLeechRadius(150, 1.5)).toBe(225)
  })
})

// ── 6. Race Twins — flankTargets ─────────────────────────────────────────

describe('flankTargets', () => {
  it('returns two targets offset left and right of the player', () => {
    const [left, right] = flankTargets({ x: 100, y: 100 }, 40)
    expect(left.x).toBe(60)
    expect(left.y).toBe(100)
    expect(right.x).toBe(140)
    expect(right.y).toBe(100)
  })

  it('targets are always symmetric around the player', () => {
    const player = { x: 200, y: 300 }
    const [left, right] = flankTargets(player, 40)
    expect((left.x + right.x) / 2).toBeCloseTo(player.x)
    expect(left.x).not.toBe(right.x)
  })
})

// ── 7. Deadlock — deadlockFacingAngle ─────────────────────────────────────

describe('deadlockFacingAngle', () => {
  const guard = { x: 0, y: 0 }

  it('returns the angle toward the player when within range', () => {
    const angle = deadlockFacingAngle(guard, { x: 100, y: 0 }, 120)
    expect(angle).toBeCloseTo(0) // pointing right
  })

  it('returns null when player is outside activation radius', () => {
    expect(deadlockFacingAngle(guard, { x: 200, y: 0 }, 120)).toBeNull()
  })

  it('returns correct angle for a diagonal player position', () => {
    const angle = deadlockFacingAngle(guard, { x: 100, y: 100 }, 200)
    expect(angle).toBeCloseTo(Math.PI / 4) // 45°
  })

  it('returns null exactly at boundary distance', () => {
    const angle = deadlockFacingAngle(guard, { x: 120, y: 0 }, 120)
    expect(angle).toBeNull()
  })
})
