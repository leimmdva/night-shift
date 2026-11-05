# Design: Monster AI

## State machine

```
PATROL ──(sees player)──► ALERT ──(800ms)──► CHASE
  ▲                                            │
  │                                    (player hides)
  │                                            ▼
  └──────────(8s timeout)────────── SEARCH

GUARD  (Deadlock only — never transitions out)
```

## Class structure

```
MonsterContext (interface)   — move, stop, positions, transition, emit, waypoints, now
BaseState (interface)        — enter(), update(delta), exit()

PatrolState   implements BaseState
AlertState    implements BaseState
ChaseState    implements BaseState
SearchState   implements BaseState
GuardState    implements BaseState   ← Deadlock only; faces player, never moves

MonsterAI                            — owns states map, calls transitionTo(), update(delta)
MonsterBehaviours                    — factory functions per monster
```

## Per-monster implementation

### 1. Null Ghost
- `MonsterAI.updateVisibility(playerAngle, playerFov)` called each frame from OfficeScene
- Sets `sprite.alpha = inCone ? 1.0 : 0.4`
- File-label text object has its own `alpha = 1.0` always

### 2. Off-by-One
- `overshootTarget(from, to, wall?)` pure function in `MonsterBehaviours.ts`
- Adds 32px past `to` along the `from→to` vector; clamps at wall boundary if supplied
- `OffByOnePatrolState extends PatrolState` overrides waypoint target calculation

### 3. Infinite Crawler
- `ClosedLoopState implements BaseState` replaces the entire state machine
- Never checks detection — catches only on 24px contact
- `MonsterAI` for Infinite Crawler is created with a single state: `LOOP`

### 4. Async Phantom
- Two `Phaser.GameObjects.Sprite`: `shadow` (low alpha, bottom layer) and `body` (top layer)
- Shadow runs standard `PatrolState` / `ChaseState` logic
- `AsyncPhantomAI extends MonsterAI` adds `teleportTimer` and overrides `update(delta)`
- On teleport: `body.x = shadow.x; body.y = shadow.y; teleportTimer = 0`

### 5. Memory Leech
- `MemoryLeechAI extends MonsterAI` adds `growthTimer`, `scale`, `trail: {x,y}[]`
- Every frame: append current position to `trail` if moved > 4px since last segment
- Every 30s: `scale = Math.min(scale + 0.1, 1.5)`, update sprite scale and detection radius
- Trail rendered as low-alpha rectangles on a dedicated graphics layer
- `OfficeScene` checks player-on-trail each frame and applies speed multiplier

### 6. Race Twins
- `RaceTwinsPair` wrapper owns two `MonsterAI` instances
- Overrides detection: if either AI's `canSeePlayer()` is true, both call `transitionTo('ALERT')`
- Flank offsets: `{x: player.x - 40, y: player.y}` and `{x: player.x + 40, y: player.y}`

### 7. Deadlock
- `GuardState implements BaseState` — only rotates to face player when < 120px, otherwise idle
- `MonsterAI` for Deadlock initialises to `GUARD` and has no transitions out
- Door collider managed by `OfficeScene`: opens when `bug-solved` event fires for `deadlock`

### 8. Legacy
- `OfficeScene` calls `legacy.setMirrorTarget(nearest)` each frame
- `LegacyAI extends MonsterAI` overrides `update`: if mirror target set, copies its velocity

## Pure-logic utilities (unit-testable, no Phaser)
All in `src/game/ai/behaviourUtils.ts`:

```ts
overshootTarget(from, to, overshootPx): {x,y}
closedLoopNext(waypoints, currentIndex): number   // always wraps
shadowBodyTeleport(shadowPos, lastTeleportMs, now, intervalMs): boolean
memoryLeechScale(currentScale, elapsedMs, intervalMs, capScale): number
flankTargets(playerPos, offsetPx): [{x,y},{x,y}]
deadlockFacingAngle(guardPos, playerPos): number
```
