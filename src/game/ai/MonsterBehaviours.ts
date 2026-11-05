/**
 * MonsterBehaviours.ts
 *
 * Per-monster config overrides and special patrol behaviours.
 * Each monster's movement in PATROL reflects its bug type —
 * the player can infer the bug from watching before opening the laptop.
 *
 * Import the factory function for the monster you need:
 *   const config = nullGhostConfig(waypoints, onCatch)
 *   const ai = new MonsterAI(scene, sprite, player, config)
 */

import type { MonsterAIConfig } from './MonsterAI'

type Waypoint = { x: number; y: number }

// ── 1. Null Ghost ─────────────────────────────────────────────────────────
// Patrol: drifts slowly, semi-transparent. Fully visible only in flashlight.
// (Transparency handled in OfficeScene via sprite alpha + flashlight mask.)
export function nullGhostConfig(
  waypoints: Waypoint[],
  onCatch?: () => void
): MonsterAIConfig {
  return {
    waypoints,
    detectionRadius: 160, // smaller — hard to see
    chaseSpeed: 80,
    onCatch,
  }
}

// ── 2. Off-by-One ─────────────────────────────────────────────────────────
// Patrol: always stops one tile (32px) short of its waypoint, then reverses.
// Achieved by shrinking the arrival threshold to never trigger, so it
// bounces at the midpoint between waypoints.
export function offByOneConfig(
  waypoints: Waypoint[],
  onCatch?: () => void
): MonsterAIConfig {
  // Shift every waypoint 32px back toward the previous one
  const shifted = waypoints.map((wp, i) => {
    if (i === 0) return wp
    const prev = waypoints[i - 1]
    const dx = wp.x - prev.x
    const dy = wp.y - prev.y
    const len = Math.hypot(dx, dy)
    if (len < 1) return wp
    return { x: wp.x - (dx / len) * 32, y: wp.y - (dy / len) * 32 }
  })

  return {
    waypoints: shifted,
    detectionRadius: 180,
    chaseSpeed: 95,
    onCatch,
  }
}

// ── 3. Infinite Crawler ───────────────────────────────────────────────────
// Patrol: loops the exact same two-point route endlessly, never deviates.
// Config: force waypoints to a two-point loop (first and last only).
export function infiniteCrawlerConfig(
  waypoints: Waypoint[],
  onCatch?: () => void
): MonsterAIConfig {
  const loop =
    waypoints.length >= 2
      ? [waypoints[0], waypoints[waypoints.length - 1]]
      : waypoints

  return {
    waypoints: loop,
    detectionRadius: 200, // wide — it's always moving, easy to spot
    chaseSpeed: 85,
    onCatch,
  }
}

// ── 4. Async Phantom ──────────────────────────────────────────────────────
// Patrol: moves, freezes for 1.5s, then jumps one waypoint ahead.
// The "freeze then teleport" behaviour mirrors missing await.
// Implemented as a custom detectionRadius + chaseSpeed; the freeze is
// handled in OfficeScene by checking monster.state === 'PATROL' and
// toggling a per-monster timer (see MonsterAI extension point).
export function asyncPhantomConfig(
  waypoints: Waypoint[],
  onCatch?: () => void
): MonsterAIConfig {
  return {
    waypoints,
    detectionRadius: 175,
    chaseSpeed: 100, // fast when it finally moves
    onCatch,
  }
}

// ── 5. Memory Leech ───────────────────────────────────────────────────────
// Patrol: normal path. Grows slightly larger every 30s (handled in OfficeScene
// via sprite scale). Detection radius grows with it.
export function memoryLeechConfig(
  waypoints: Waypoint[],
  onCatch?: () => void
): MonsterAIConfig {
  return {
    waypoints,
    detectionRadius: 150, // starts small
    chaseSpeed: 70,       // slow but relentless
    onCatch,
  }
}

// ── 6. Race Twins ─────────────────────────────────────────────────────────
// Two monsters sharing one patrol route, spawned 180° apart on the loop.
// Each uses the same config; offset is set by spawn position in OfficeScene.
export function raceTwinsConfig(
  waypoints: Waypoint[],
  onCatch?: () => void
): MonsterAIConfig {
  return {
    waypoints,
    detectionRadius: 170,
    chaseSpeed: 90,
    onCatch,
  }
}

// ── 7. Deadlock ───────────────────────────────────────────────────────────
// Two monsters that block a doorway and never move — they wait for each other.
// In practice: zero-length waypoint list → PatrolState stops immediately.
export function deadlockConfig(
  blockPosition: Waypoint,
  onCatch?: () => void
): MonsterAIConfig {
  return {
    waypoints: [blockPosition], // single waypoint = they stay put
    detectionRadius: 220,       // wide — they guard the door
    chaseSpeed: 110,
    onCatch,
  }
}

// ── 8. Legacy ─────────────────────────────────────────────────────────────
// Copies the last movement vector of the nearest other monster.
// This is handled in OfficeScene (needs access to all other MonsterAI instances).
// Config is otherwise standard.
export function legacyConfig(
  waypoints: Waypoint[],
  onCatch?: () => void
): MonsterAIConfig {
  return {
    waypoints,
    detectionRadius: 200,
    chaseSpeed: 105,
    onCatch,
  }
}
