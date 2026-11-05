/**
 * behaviourUtils.ts
 *
 * Pure-logic functions for per-monster behaviour.
 * No Phaser imports — fully unit-testable with Vitest.
 */

export type Point = { x: number; y: number }

// ── 1. Null Ghost ─────────────────────────────────────────────────────────

/**
 * Returns true if `target` is inside the view cone defined by
 * `origin`, `facingAngle` (radians) and `halfFovRad`.
 */
export function isInViewCone(
  origin: Point,
  facingAngle: number,
  halfFovRad: number,
  target: Point
): boolean {
  const dx = target.x - origin.x
  const dy = target.y - origin.y
  if (dx === 0 && dy === 0) return true
  const angleToTarget = Math.atan2(dy, dx)
  const diff = Math.abs(normaliseAngle(angleToTarget - facingAngle))
  return diff <= halfFovRad
}

function normaliseAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI
  while (a < -Math.PI) a += 2 * Math.PI
  return a
}

// ── 2. Off-by-One ─────────────────────────────────────────────────────────

/**
 * Returns a point `overshootPx` beyond `to` along the `from→to` vector.
 * If `wallBoundary` is provided, the result is clamped so it does not
 * exceed that axis-aligned bounding box.
 */
export function overshootTarget(
  from: Point,
  to: Point,
  overshootPx: number,
  wallBoundary?: { minX: number; maxX: number; minY: number; maxY: number }
): Point {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy)
  if (len < 0.001) return { ...to }

  const nx = dx / len
  const ny = dy / len

  let rx = to.x + nx * overshootPx
  let ry = to.y + ny * overshootPx

  if (wallBoundary) {
    rx = Math.max(wallBoundary.minX, Math.min(wallBoundary.maxX, rx))
    ry = Math.max(wallBoundary.minY, Math.min(wallBoundary.maxY, ry))
  }

  return { x: rx, y: ry }
}

// ── 3. Infinite Crawler ───────────────────────────────────────────────────

/**
 * Returns the next waypoint index for a closed loop.
 * Unlike PatrolState, this never short-circuits to ALERT/CHASE/SEARCH.
 */
export function closedLoopNext(waypoints: Point[], currentIndex: number): number {
  if (waypoints.length === 0) return 0
  return (currentIndex + 1) % waypoints.length
}

// ── 4. Async Phantom ──────────────────────────────────────────────────────

/**
 * Returns true when the body should teleport to the shadow's position.
 * Pure: just compares elapsed time against the interval.
 */
export function shouldTeleport(
  lastTeleportMs: number,
  nowMs: number,
  intervalMs: number
): boolean {
  return nowMs - lastTeleportMs >= intervalMs
}

// ── 5. Memory Leech ───────────────────────────────────────────────────────

/**
 * Returns the new scale after one growth tick.
 * Caps at `capScale`.
 */
export function memoryLeechGrow(currentScale: number, growAmount: number, capScale: number): number {
  return Math.min(currentScale + growAmount, capScale)
}

/**
 * Returns the detection radius for the current scale.
 * Linear: baseRadius * scale.
 */
export function memoryLeechRadius(baseRadius: number, scale: number): number {
  return baseRadius * scale
}

// ── 6. Race Twins ─────────────────────────────────────────────────────────

/**
 * Returns the two flank target positions for the Race Twins.
 * twinA targets left of the player, twinB targets right.
 */
export function flankTargets(
  playerPos: Point,
  offsetPx: number
): [Point, Point] {
  return [
    { x: playerPos.x - offsetPx, y: playerPos.y },
    { x: playerPos.x + offsetPx, y: playerPos.y },
  ]
}

// ── 7. Deadlock ───────────────────────────────────────────────────────────

/**
 * Returns the angle (radians) the guard should face to look at the player.
 * Returns null if the player is outside the activation range.
 */
export function deadlockFacingAngle(
  guardPos: Point,
  playerPos: Point,
  activationRadius: number
): number | null {
  const dist = Math.hypot(playerPos.x - guardPos.x, playerPos.y - guardPos.y)
  if (dist >= activationRadius) return null
  return Math.atan2(playerPos.y - guardPos.y, playerPos.x - guardPos.x)
}
