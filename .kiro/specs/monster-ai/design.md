# Design: Monster AI

## State machine

```
PATROL ──(sees player)──► ALERT ──(800ms)──► CHASE
  ▲                                            │
  │                                    (player hides)
  │                                            ▼
  └──────────(8s timeout)────────── SEARCH
```

## Class structure

```
MonsterContext (interface)    — what a state needs: move, stop, positions, transition, emit
BaseState (interface)         — enter(), update(delta), exit()

PatrolState  implements BaseState   — walks waypoint loop, checks detection
AlertState   implements BaseState   — stops 800ms, then transitions CHASE
ChaseState   implements BaseState   — follows player, catches or loses
SearchState  implements BaseState   — wanders near last known position, times out

MonsterAI                           — owns states map, calls transitionTo(), exposes update(delta)
MonsterBehaviours                   — factory functions per monster (config overrides + shifted waypoints)
```

## Per-monster behaviour implementation

| Monster | Mechanism |
|---|---|
| Null Ghost | Low alpha sprite, flashlight mask in OfficeScene |
| Off-by-One | Waypoints shifted 32px back in `offByOneConfig()` |
| Infinite Crawler | Waypoints clamped to 2 points (first + last) |
| Async Phantom | Freeze timer in OfficeScene reads `ai.state === 'PATROL'` |
| Memory Leech | OfficeScene scales sprite up 5% every 30s |
| Race Twins | Two `MonsterAI` instances, same waypoints, offset spawn |
| Deadlock | Single waypoint = doorway position, never moves |
| Legacy | OfficeScene copies velocity of nearest other monster each frame |

## Line of sight
Ray-cast: 12 sample points along the line from monster to player.
If any sample overlaps a wall collider rectangle → no line of sight.
Wall group passed as optional config; if absent, LOS is always clear (Act 1 prototype).
