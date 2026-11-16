# Tasks: Game Flow

Requirements: [requirements.md](requirements.md). Design: [design.md](design.md).
Each task has an acceptance check (**Check**) that someone other than the author can run.
Order is fixed: finish a milestone before starting the next.

## Milestone 1 — Vertical slice
Act 1 with Null Ghost on the live site: the player sprite walks the office with collisions from office.json, the camera follows, the player can enter/leave hide spots, Null Ghost spawns and uses MonsterAI, the laptop opens only when hidden, pack 01 (profile.js) can be fixed in Monaco, tests pass, the ghost dissolves, the autopsy card shows.

### 1.1 Pure flow logic
- [x] `src/state/runState.ts`: `RunState`, `onSolved`, `onCaught`, `actOf`. **Check:** Vitest unit tests cover each function; `npx vitest run` passes.
- [x] `src/game/flow/queue.ts`: `nextBug` over the packs that exist. **Check:** unit test: with nothing solved returns pack 01; with 01 solved returns 02; with all solved returns `null`.
- [x] `src/game/flow/spawner.ts`: `pickSpawns` with the 6-tile desk rule and fallback. **Check:** unit test on `office.json` returns only spawns at least 6 tiles from the desk; fast-check property over random player positions.

### 1.2 Player and map
- [x] Load `office.json` and the 66 office pieces in `RoomScene`; draw floor, walls, props, decals. **Check:** `npm run dev`, the office looks like `docs/art/office-preview.png`.
- [x] Player sprite (gender-neutral junior dev, hoodie, headphones, flashlight, 4 directions, 2-frame walk) in `scripts/sprites/src/player/`, built into `public/sprites/player/`. **Check:** `docs/art/player-preview.png` exists and the sprite matches the monsters' style (owner review).
- [x] Movement with arrow keys/WASD, collisions from `walkable` and props with `blocks: true`. **Check:** unit test of the collision function on `office.json`; manually the player cannot walk through the fridge, counter or desk.
- [x] Camera follows the player, clamped to the 640 x 448 map. **Check:** at the map edges no area outside the map is visible.

### 1.3 Hiding
- [x] Enter/leave hide spots at `enter` tiles with the interact key; hidden sprite state. **Check:** Playwright: walk to `locker`, press interact, state is `hidden`; press again, state is `walking` on the `enter` tile.
- [x] Hint on screen when the player is next to a hide spot. **Check:** the hint shows only within 1 tile of an `enter` tile.

### 1.4 Null Ghost
- [ ] Spawn Null Ghost after 20 to 120 s of control, using `pickSpawns`. **Check:** Playwright reads the spawn position and asserts distance to desk ≥ 6 tiles and time ≤ 120 s.
- [ ] Wire `MonsterAI` with the Null Ghost behaviour; ghost patrols, alerts, chases, searches. **Check:** Playwright reads the ghost state over time and sees PATROL and at least one other state when the player walks into view.
- [ ] Catch: when `mode === 'walking'` and within catch radius emit `player-caught`; run the checkpoint catch sequence. **Check:** Playwright lets the ghost catch the player; the screen flashes, position resets, death count is 1, the monster is still alive.
- [ ] A hidden player is never caught. **Check:** unit test of the catchable rule; manual: hide, let the ghost reach the spot, no catch.

### 1.5 Laptop and fix
- [ ] Laptop key opens `LaptopScene` only when hidden and a monster is active; otherwise a locked cue. **Check:** Playwright: laptop key while walking does nothing; while hidden the editor appears.
- [ ] The room scene keeps updating while the laptop is open. **Check:** Playwright with the laptop open: the ghost's position changes between two samples.
- [ ] Monaco shows `01-null-ghost` `brokenCode`; Run Tests uses the worker. **Check:** unchanged code shows failing tests; pasting `solutionCode` shows all passing.
- [ ] On pass: emit `bug-solved`, close the laptop, dissolve the ghost over 1.5 s, save to `night-shift-save`. **Check:** Playwright: after the fix the ghost is gone and `localStorage['night-shift-save']` lists `null-ghost`.
- [ ] Autopsy card (UI kit dialog panel) with the three pack texts. **Check:** the card shows `what`, `impact`, `fix` from `src/bugs/01-null-ghost/index.ts`; each under 20 words.

### 1.6 Live site
- [ ] `npm run build`, push is done by the owner; verify the Vercel deploy. **Check:** Playwright E2E for the slice path runs against the live URL and passes; Monaco is ready before the ghost spawns.
- [ ] Record slice results in `docs/KIRO_LOG.md`. **Check:** entry has a commit hash.

## Milestone 2 — Act 1 complete (Off-by-One)
- [ ] Title screen with Continue / New Game / Settings / Quit from the UI kit. **Check:** Playwright reaches the office from "New Game".
- [ ] Queue wiring: fixing 01 spawns 02 after 10 to 20 s. **Check:** unit test of the spawn delay; Playwright with two fixes.
- [ ] Off-by-One behaviour and pack 02 in the flow. **Check:** pack 02 fixable end to end.
- [ ] Act title card 23:47. **Check:** visible for 3 s without blocking input.
- [ ] Save/resume: Continue restores solved packs, hint levels, death count. **Check:** reload mid-run, 01 stays solved; corrupt save is ignored and "Continue" is hidden.

## Milestone 3 — Act 2
- [ ] Act 2 card (00:30) and Infinite Crawler (pack 03). **Check:** the 5 s worker timeout prevents a freeze; the test output shows the timeout.
- [ ] Async test runner and per-test timeout in the runner (design: "Async test runner"). **Check:** runner unit test: a never-resolving async test fails alone, other tests still report.
- [ ] Async Phantom (pack 04, new). **Check:** `npm run validate-packs` passes for 04.
- [ ] Memory Leech (pack 05, new). **Check:** `npm run validate-packs` passes for 05. First candidate for cutting under the cut order.
- [ ] Player-visible checkpoint rule from the checkpoint spec after each fix. **Check:** after a catch the player returns to the hide spot nearest the last solved bug.

## Milestone 4 — Act 3
- [ ] Act 3 card (02:00). Race Twins as a pair on two valid spawns (pack 06, new). **Check:** both sprites exist, the pack validates, fix dissolves both.
- [ ] Deadlock golems at `serverDoor.golemSlots` from Act 3 on, GUARD state (pack 07, new). **Check:** Playwright: golems stay put until the fix. Second candidate for cutting.
- [ ] Door opens when `transfer.js` is fixed. **Check:** `serverDoor` tiles become walkable only after the fix.

## Milestone 5 — Server room and Legacy
- [ ] `src/game/maps/server-room.json` and sprites, red lighting, at least one hide spot. **Check:** reachability script (like the office one) passes; owner reviews a preview.
- [ ] `ServerRoomScene` and the door transition. **Check:** crossing the door line fades into the server room; no return to the office.
- [ ] `BugPack.files` and multi-file runner/validator support. **Check:** `validate-pack.js` handles a 3-file pack; unit tests.
- [ ] Multi-file editor with tabs. **Check:** switching tabs keeps each file's edits until the laptop closes.
- [ ] Legacy pack 08: `billing.js`, `invoice.js`, `utils.js`, floating-point rounding. **Check:** broken fails, solution passes; a single-file fallback is allowed if time is short (bug-pack rules).

## Milestone 6 — Morning meeting, postmortem, Sudo portrait, sound
- [ ] `MorningScene` with 3 questions from solved packs. **Check:** unit test for question selection with cut packs.
- [ ] Postmortem generation and DOM overlay (postmortem spec); clear save on exit. **Check:** `localStorage['night-shift-report']` set; `night-shift-save` removed.
- [ ] Sudo portrait (amber glow, glasses, coffee mug) in the laptop corner, hint messages. **Check:** three hint levels appear in order; after level 3 "I've told you everything I know."
- [ ] Web Audio synth SFX and a signature per monster. **Check:** unit test that each monster id has a signature; manual listening check.
- [ ] CC0 ambience and music in `public/audio/`, all listed in README with source and licence. **Check:** every file in `public/audio/` has a README row.

## Milestone 7 — Polish
- [ ] Easy and Normal difficulty modes. **Check:** Easy lowers monster speed and widens the safe distance; documented values.
- [ ] Settings (volume, music, SFX) using the UI kit. **Check:** values persist after reload.
- [ ] Timing pass: a full run takes 15 to 20 minutes, first monster within 2 minutes. **Check:** three timed playthroughs recorded in `docs/KIRO_LOG.md`.
- [ ] Performance targets from `tech.md` on the live deploy. **Check:** Lighthouse results recorded.
- [ ] Playtests with 3 external players. **Check:** notes in `docs/KIRO_LOG.md`.
