# Tasks: Monster AI

## Implementation tasks

### Core (done)
- [x] `MonsterState.ts` — PatrolState, AlertState, ChaseState, SearchState, BaseState interface
- [x] `MonsterAI.ts` — state machine driver, MonsterAIConfig, buildContext()
- [x] `MonsterBehaviours.ts` — factory functions (config only, pre-behaviour-class split)

### Pure-logic utilities
- [ ] Create `src/game/ai/behaviourUtils.ts` with: `overshootTarget`, `closedLoopNext`, `shadowBodyTeleport`, `memoryLeechScale`, `flankTargets`, `deadlockFacingAngle`
- [ ] Write Vitest tests in `src/game/ai/__tests__/behaviourUtils.test.ts` — all functions pass

### Per-monster state classes
- [ ] `GuardState` in `MonsterState.ts` — faces player within 120px, never moves, no transitions
- [ ] `ClosedLoopState` in `MonsterState.ts` — walks all waypoints as closed loop, catches on contact only
- [ ] Update `MonsterAI` to support `GUARD` and `LOOP` as valid StateKeys
- [ ] `OffByOnePatrolState` in `MonsterBehaviours.ts` — overshoot each target by 32px
- [ ] `AsyncPhantomAI` in `MonsterBehaviours.ts` — shadow/body split, 1500ms teleport
- [ ] `MemoryLeechAI` in `MonsterBehaviours.ts` — 30s growth, trail, speed multiplier hook
- [ ] `RaceTwinsPair` in `MonsterBehaviours.ts` — shared detection, flank targeting

### Bug pack behaviour text
- [ ] Update `monster.behaviour` in `src/bugs/01-null-ghost/index.ts` — alpha 0.4 / view cone
- [ ] Update `monster.behaviour` in `src/bugs/02-off-by-one/index.ts` — overshoot 32px past target

### Integration (OfficeScene)
- [ ] Spawn Null Ghost with waypoints, wire `MonsterAI.updateVisibility()` in scene update
- [ ] Spawn Off-by-One using `OffByOnePatrolState`
- [ ] Spawn Infinite Crawler using `ClosedLoopState`
- [ ] Spawn Async Phantom using `AsyncPhantomAI`
- [ ] Spawn Memory Leech using `MemoryLeechAI`, apply trail speed check each frame
- [ ] Spawn Race Twins using `RaceTwinsPair`
- [ ] Spawn Deadlock pair using `GuardState`, wire door collider to `bug-solved` event
- [ ] Legacy: wire `setMirrorTarget` in scene update

## Acceptance tests (manual, in browser)
- [ ] Null Ghost: sprite dim in open office, bright when player looks at it
- [ ] Off-by-One: always passes its target by ~32px then corrects
- [ ] Infinite Crawler: never reacts to player, catches only on direct contact
- [ ] Async Phantom: shadow visible ahead of body, body jumps to shadow every ~1.5s
- [ ] Memory Leech: grows visibly over time, trail slows player
- [ ] Race Twins: both charge simultaneously, arrive from opposite sides
- [ ] Deadlock: never moves, rotates to face player, door stays closed until pack solved
