# Tasks: Monster AI

## Implementation tasks

- [x] Create `src/game/ai/MonsterState.ts` — `MonsterContext` interface, `BaseState` interface, all 4 state classes
- [x] Create `src/game/ai/MonsterAI.ts` — state machine driver, `MonsterAIConfig`, `buildContext()`
- [x] Create `src/game/ai/MonsterBehaviours.ts` — factory functions for all 8 monsters
- [ ] Integrate `MonsterAI` into `OfficeScene` — spawn Null Ghost with waypoints, wire `onCatch`
- [ ] Add flashlight mask to `OfficeScene` — Null Ghost alpha, Act 2 darkness
- [ ] Add `isHiding` flag to player object — set on hide spot enter/exit
- [ ] Implement per-monster special behaviours in `OfficeScene`:
  - [ ] Async Phantom freeze timer
  - [ ] Memory Leech scale growth
  - [ ] Race Twins dual spawn
  - [ ] Legacy velocity copy

## Acceptance tests

- [ ] Null Ghost spawns and walks its waypoint loop
- [ ] Player walks into detection radius → ALERT pause → CHASE
- [ ] Player enters hide spot → SEARCH → 8s → PATROL
- [ ] Monster reaches player → `player-caught` event fires
- [ ] Defeated monster: stops moving, no further AI updates
