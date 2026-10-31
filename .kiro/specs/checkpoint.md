# Spec: Checkpoint System

## Goal
Death is not a punishment — it is a teaching tool.
When caught, the player keeps all progress and gains a hint.

## Rules

### What a checkpoint is
A checkpoint is created at each hide spot where the player has solved at least one bug.
The most recent checkpoint is where the player wakes after being caught.

If no bug has been solved yet, the player wakes at the starting position (desk near the entrance).

### On catch
1. Screen flashes white (200ms)
2. All monsters freeze for 1 second
3. Fade to black (500ms)
4. Player position resets to checkpoint location
5. Monsters resume patrol from their current positions (not respawned)
6. Solved bugs remain solved — their monsters do not return
7. Player gains one hint level on the bug whose monster caught them
   - If already at level 3: no change, Sudo sends "I've already told you everything."
8. Fade in (500ms)
9. Sudo sends: "You know where to find the fix."

### What is saved (localStorage key: `night-shift-save`)
```typescript
interface SaveState {
  solvedBugIds: string[]       // e.g. ['null-ghost', 'off-by-one']
  hintLevels: Record<string, number>  // bugId → hint level used (0–3)
  checkpointBugId: string | null      // bug id of the last solved bug
  deathCount: number
  startedAt: number            // unix timestamp
}
```

### Saving triggers
- [ ] Save written to localStorage immediately after a bug is solved
- [ ] Save written immediately after a death (updated hintLevel, deathCount)
- [ ] Save written when the player reaches the morning meeting

### Loading
- [ ] On game boot, check localStorage for existing save
- [ ] If save exists: restore `solvedBugIds`, `hintLevels`, skip solved monsters
- [ ] No "continue / new game" menu for v1 — existing save always resumes
  (can be added post-submission if time allows)

### Clearing
- [ ] Save is cleared when the morning meeting ends (run complete)
- [ ] Save is NOT cleared on page reload mid-run

## Requirements

- [ ] `SaveState` type defined in `src/types/SaveState.ts`
- [ ] `save(state)` and `load(): SaveState | null` functions in `src/state/checkpoint.ts`
- [ ] `checkpoint.ts` has unit tests (Vitest) covering save/load/clear round-trips
- [ ] No game logic in `checkpoint.ts` — pure data in/out

## Acceptance tests

### Death → resume
1. Solve null-ghost. Get caught by off-by-one.
2. Wake at desk where null-ghost was solved.
3. null-ghost monster is gone. off-by-one is still active.
4. off-by-one hint level is now 1.

### Page reload mid-run
1. Solve null-ghost. Reload the page.
2. Game resumes: null-ghost is already defeated, player at checkpoint.

### Run complete
1. Reach morning meeting. Answer questions.
2. Reload page. No save exists — fresh run.
