# Design: Checkpoint System

## SaveState schema (localStorage: `night-shift-save`)

```typescript
interface SaveState {
  solvedBugIds: string[]              // e.g. ['null-ghost', 'off-by-one']
  hintLevels: Record<string, number>  // bugId → hints used (0–3)
  checkpointBugId: string | null      // id of last solved bug (null = start)
  deathCount: number
  startedAt: number                   // unix timestamp ms
}
```

## Module: `src/state/checkpoint.ts`

```
save(state: SaveState): void
  → JSON.stringify → localStorage.setItem('night-shift-save', ...)

load(): SaveState | null
  → localStorage.getItem → JSON.parse → validate shape → return | null

clear(): void
  → localStorage.removeItem('night-shift-save')
```

Pure data in/out. No Phaser imports. Fully unit-testable with Vitest.

## Catch flow (OfficeScene)

```
player-caught event
  └─ screen flash (white rect, alpha 1→0, 200ms)
  └─ freeze all MonsterAI instances (set defeated flag temporarily)
  └─ fade to black (500ms)
  └─ reset player position to checkpoint
  └─ increment hintLevel for catching monster's bugId
  └─ save()
  └─ unfreeze monsters
  └─ fade in (500ms)
  └─ Sudo message
```
