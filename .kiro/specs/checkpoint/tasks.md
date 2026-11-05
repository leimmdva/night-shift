# Tasks: Checkpoint System

## Implementation tasks

- [ ] Define `SaveState` interface in `src/types/SaveState.ts`
- [ ] Create `src/state/checkpoint.ts` — `save()`, `load()`, `clear()` using localStorage
- [ ] Write Vitest unit tests for `checkpoint.ts` — save/load/clear round-trips
- [ ] Wire `save()` into `LaptopScene` after bug solved (`bug-solved` event)
- [ ] Wire catch flow into `OfficeScene` — screen flash, freeze, fade, reset position
- [ ] Wire hint level increment into catch flow
- [ ] On game boot: call `load()`, skip solved monsters, restore hint levels
- [ ] Call `clear()` at end of morning meeting scene

## Acceptance tests

- [ ] Solve null-ghost → get caught by off-by-one → wake at null-ghost desk, off-by-one hint level = 1
- [ ] Reload page mid-run → null-ghost defeated, player at checkpoint
- [ ] Complete morning meeting → reload → fresh run (no save)
