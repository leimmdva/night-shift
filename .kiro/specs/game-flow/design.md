# Design: Game Flow

Requirements: [requirements.md](requirements.md). Linked specs: [editor](../editor/design.md), [runner](../runner/design.md), [monster-ai](../monster-ai/design.md), [bug-pack-validation](../bug-pack-validation/design.md), [checkpoint](../checkpoint/design.md), [postmortem](../postmortem/design.md).

## Scenes

```
BootScene ─► TitleScene ─► OfficeScene ◄─► (laptop overlay: LaptopScene)
                              │
                              └─(Deadlock fixed, door crossed)─► ServerRoomScene ◄─► LaptopScene
                                                                      │
                                           (Legacy fixed)             ▼
                                                              MorningScene ─► PostmortemOverlay (DOM) ─► TitleScene
```

- `OfficeScene` and `ServerRoomScene` share one base class, `RoomScene`, that owns the player, camera, hiding, monsters and HUD. They differ in map file, lighting and spawn points.
- `LaptopScene` is launched on top of the room scene with `scene.launch`; the room scene is **not** paused. This is how the world keeps running while the laptop is open.
- The postmortem is a DOM overlay (postmortem spec). `TitleScene`, `MorningScene` and the autopsy card use the UI kit in `public/sprites/ui/`.

## Run state

One plain TypeScript module, `src/state/runState.ts`, holds the run. No Phaser objects inside it, so it is unit-testable.

```ts
interface RunState {
  act: 1 | 2 | 3 | 4              // 4 = final
  solved: string[]                // pack ids
  hintLevels: Record<string, 0|1|2|3>
  deaths: number
  checkpoint: { room: 'office' | 'server'; x: number; y: number }
  serverRoomReached: boolean
  cut: string[]                   // pack ids removed under the cut order
}
```

The save shape in the checkpoint spec is a superset of this. `runState.ts` exposes pure functions: `nextBug(state, queue)`, `actOf(packOrder)`, `onSolved(state, id)`, `onCaught(state)`.

## Queue and spawner

`src/game/flow/queue.ts`: `QUEUE = packs sorted by order`. `nextBug` returns the first pack not in `solved` and not in `cut`, or `null` (run over).

`src/game/flow/spawner.ts`:
1. `pickSpawns(map, playerPos, count)` is a pure function. It filters `monsterSpawns` by distance ≥ 6 tiles to the nearest tile of `playerDesk`, sorts the rest by distance from `playerPos` descending, and returns the first `count` (1 normally, 2 for Race Twins). If the filter empties the list it falls back to the farthest spawns from the desk.
2. `SpawnTimer` waits for the delay (10 to 20 s after the autopsy card closes, 0 to 120 s window for the first monster) and then asks the scene to create the monster.

Distance is Euclidean in tile units. With the current map all four spawns pass the filter; the desk is at (15,7) and the nearest spawn, (9,4), is about 6.7 tiles away.

## Hiding and laptop gating

State on the player: `mode: 'walking' | 'hidden'`, `hideSpotId`, `laptopOpen`.

| Event | From | To |
|---|---|---|
| interact on `enter` tile of a hide spot | walking | hidden (sprite hidden, camera stays) |
| interact | hidden, laptop closed | walking at `enter` tile |
| laptop key | hidden, active bug exists | hidden, `laptopOpen = true` |
| laptop key | walking | no change, "locked" cue |
| solve / close | `laptopOpen` | `laptopOpen = false`, still hidden |

Catch check, run each frame by the room scene before it emits `player-caught`:

```ts
const catchable = player.mode === 'walking'
```

A hidden player is never catchable, so the "laptop open" case is covered by the same rule. MonsterAI already moves hidden-player cases to SEARCH (monster-ai spec). Because the laptop never pauses the scene, search movement and sound continue; `SoundBus` raises the monster's sound volume by distance to the player, so a monster at the hide spot is loud.

## Monster sound

`src/audio/synth.ts` builds short SFX with Web Audio (oscillators, noise, filters, gain envelopes). Each monster id maps to a signature in `src/audio/signatures.ts` (for example Null Ghost: filtered noise with a falling tone, Deadlock: low square thump). Ambience and music are CC0 files in `public/audio/`, listed with source and licence in README.

## Acts, clock and title cards

`actOf(order)`: 1–2 → Act 1, 3–5 → Act 2, 6–7 → Act 3, 8 → Final. Clock labels 23:47, 00:30, 02:00, 03:33. The act changes when the first pack of the new act becomes queue head. The card is a HUD element and does not pause the scene.

## Deadlock golems and the server door

At the start of Act 3 the scene creates two golems at `serverDoor.golemSlots` in the `GUARD` state (monster-ai). They are static obstacles. Race Twins are the active bug first. After Race Twins are fixed, Deadlock becomes the active bug and the player opens its laptop from a hide spot like any other bug. On `bug-solved` for `07-deadlock`: dissolve both golems, play the door-open animation, enable the `serverDoor` tiles in the walkable grid, add a trigger on the door line.

## Server room

A second map, `src/game/maps/server-room.json`, same schema as `office.json` (grid, tiles, props, hideSpots, entrance, monsterSpawns, walkable), narrow (about 8 x 14 tiles at 32 px) with red lighting. It is a new file; `office.json` is not changed. `ServerRoomScene` extends `RoomScene`, applies a red tint overlay and a flicker, and has at least one hide spot.

## Legacy multi-file pack

`BugPack` gets an optional `files: { name, brokenCode, solutionCode }[]`. A single-file pack is treated as `files` of length 1. The runner concatenates files in order (`utils.js`, `invoice.js`, `billing.js`) plus the tests. The editor shows one tab per file using the UI kit tabs. Validation runs the same assertions over the concatenation. See bug-pack-validation, which needs a task for this.

## Async test runner

Pack 04 (Async Phantom) needs tests that `await`. The runner's inline test function becomes async-aware: `test(name, fn)` pushes a promise, the worker awaits all of them, and each test has its own timeout (default 1000 ms) so one hanging promise fails one test and not the run. The global 5000 ms worker timeout stays. See runner tasks.

## Save and resume

`checkpoint.ts` (checkpoint spec) owns serialisation. Game flow adds only the fields in `RunState` and the resume procedure:

1. `load()` returns `RunState | null`. Parse or shape errors return `null`.
2. Title screen shows "Continue" only when `load()` is non-null.
3. Resume places the player at `checkpoint`, restores hint levels, calls `nextBug`, and the spawner spawns it using the normal rules.
4. If `serverRoomReached`, start `ServerRoomScene` instead.

## Morning meeting

`MorningScene` takes questions from the `morning` field of each solved pack. It picks 3, preferring one per act, and shuffles answer order with a seeded shuffle so tests are stable. After answer 3 it calls the postmortem generator and shows the DOM overlay. Leaving the overlay calls `clear()` and goes to `TitleScene`.

## Testing

- Unit (Vitest): `pickSpawns`, `nextBug`, `actOf`, `onSolved`, `onCaught`, resume from a corrupt save, catchable rule.
- Property-based (fast-check): for any player position, `pickSpawns` never returns a spawn within 6 tiles of the desk; the queue never has more than one active bug under any sequence of solve/catch events.
- E2E (Playwright): the vertical slice path on the dev server and later on the live site.
