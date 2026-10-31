# Spec: Monster AI

## Goal
Each monster has simple, readable behaviour that telegraphs its bug type
before the player reads a single line of code.

## State machine

Every monster runs one state machine with four states:

```
PATROL → ALERT → CHASE → SEARCH
           ↑                |
           └────────────────┘ (lost player)
```

| State | Trigger to enter | Trigger to leave |
|---|---|---|
| PATROL | Spawn | Player enters detection radius |
| ALERT | Player enters detection radius | After 0.8s pause → CHASE |
| CHASE | After ALERT pause | Player hides OR player caught |
| SEARCH | Player breaks line of sight | 8s timeout → PATROL |

## Detection

- **Detection radius:** 180px (Normal), 220px (Easy: wider for tutorialising)
- **Line of sight:** Ray cast from monster to player. Blocked by desk colliders.
- **Flashlight cone:** In Act 2+ (lights out), monsters only enter ALERT if the player's
  flashlight cone intersects them OR they are within 80px (sound detection).
- **Hiding:** Player inside a hide spot breaks line of sight. Monster enters SEARCH.
  If monster reaches the hide spot and player is still inside → player caught.

## Per-monster behaviour rules

Each monster's movement pattern in PATROL reflects its bug type.
The player can infer the bug from watching the monster before opening the laptop.

| Monster | PATROL behaviour | Why it matches the bug |
|---|---|---|
| Null Ghost | Drifts through walls (opacity 40%), solid only in flashlight | Null: invisible until you look |
| Off-by-One | Always stops one tile short of its waypoint | Off-by-one: almost right |
| Infinite Crawler | Loops the same path endlessly, never deviates | Infinite loop: same path forever |
| Async Phantom | Moves, then freezes 1.5s, then teleports one step | Async: action arrives late |
| Memory Leech | Grows slightly larger every 30s (max 1.5× scale) | Memory leak: grows over time |
| Race Twins | Two monsters sharing one patrol route, bumping each other | Race condition: two processes, one resource |
| Deadlock | Two monsters blocking a doorway, neither moving | Deadlock: waiting for each other |
| Legacy | Copies the last movement of the nearest other monster | Root cause propagation |

## Speed values

| Act | PATROL speed | CHASE speed |
|---|---|---|
| Act 1 (23:47) | 60 px/s | 90 px/s |
| Act 2 (00:30) | 80 px/s | 120 px/s |
| Act 3 (02:00) | 90 px/s | 140 px/s |
| Act 4 / Final | 100 px/s | 160 px/s |

Easy mode: all speeds × 0.7.

## Catch

- On catch: screen flash, Sudo sends "You know where to find the fix."
- Player wakes at the last checkpoint (nearest hide spot where a bug was solved).
- All previously solved bugs remain solved.
- Player gains one hint level on the bug that caught them (capped at level 3).

## Requirements

- [ ] State machine implemented as a plain TypeScript class `MonsterAI`
- [ ] Each state has `enter()`, `update(delta)`, `exit()` methods
- [ ] Pathfinding uses Phaser's built-in arcade physics + waypoint list (no NavMesh for v1)
- [ ] Per-monster behaviour is a subclass or strategy object — not a switch statement in update()
- [ ] PATROL waypoints are defined in the Tiled map as object layers
- [ ] Monster speed and detection radius are configurable per monster instance
- [ ] Flashlight cone check is deferred to Act 2 (not required for Act 1 prototype)

## Acceptance tests

### Basic patrol
1. Spawn Null Ghost. Confirm it follows its waypoint loop.
2. Player stands far away. Monster stays in PATROL.

### Detection → chase
1. Player walks into detection radius. Monster pauses (ALERT).
2. After 0.8s, monster chases player.

### Hide
1. Player enters a hide spot. Monster enters SEARCH.
2. Monster wanders for 8s, returns to PATROL.

### Catch
1. Monster catches player. Screen flash.
2. Player wakes at checkpoint. Solved bugs still solved. Hint gained.
