# Session 07: Production kickoff: steering decisions, game-flow spec, UI kit

- Date: 2026-11-15
- How Kiro was run: Kiro CLI, non-interactive (one prompt, run to completion, log captured).
- Commit(s): 37ab6e7 (steering), 5c3fa5e (game-flow spec), d8b8ee3 (UI kit)

## Prompt given to Kiro

````markdown
We are starting production of Night Shift. Do these three parts in order, committing after each part. Do not push. Follow the dev-log steering rule for every commit. Work in passes so partial progress is always on disk.

PART 1 — Lock the decisions into steering
The owner has made these final decisions. Update .kiro/steering/product.md (and project.md / tech.md where relevant) so every future session follows them, and remove anything that contradicts them:
- Scope: all 8 monsters ship (Null Ghost, Off-by-One, Infinite Crawler, Async Phantom, Memory Leech, Race Twins, Deadlock, Legacy). Last-resort cut order if late: Memory Leech, then Deadlock.
- Flow: ONE active bug at a time. When a bug is fixed, the next monster spawns. Race Twins come as a pair. From Act 3 on, the two Deadlock golems stand at the server door permanently until transfer.js is fixed.
- Laptop: the laptop can only be opened inside a hide spot. While it is open the world keeps running: the monster searches, its sound is audible, but it can NOT catch a hidden player.
- Play time: 15–20 minutes for a full run; the first monster appears within the first 2 minutes.
- Map: the one-room office (src/game/maps/office.json, commit 853d1f8, approved by the owner — do not restyle it) plus a small second room, the SERVER ROOM, behind the server door. The door opens when Deadlock is fixed. The final (Legacy) happens in the narrow, red-lit server room.
- Player: a gender-neutral junior developer in a hoodie with headphones and a flashlight, drawn in the same 2.5D pixel-art style as the monsters.
- Sudo: a friendly amber-glowing ghost of a senior developer with glasses and a coffee mug. Appears only as a portrait in the corner of the laptop screen, never walks the map.
- Sound: ambience and music from CC0 sources only, every file and its source listed in README; short SFX (footsteps, test pass, test fail, caught, monster sounds) synthesised in code with Web Audio. Each monster has its own sound signature.
- Approved art: monster sprites (53b32f3) and the office map (853d1f8).

PART 2 — Game-flow spec
Create .kiro/specs/game-flow/ with requirements.md (EARS: WHEN … THE SYSTEM SHALL …), design.md and tasks.md covering the whole run: boot and title screen, acts 1–3 and the final, the monster queue (one active bug), spawn rules (use monsterSpawns from office.json, never within 6 tiles of the player's desk), hiding and the laptop rule above, catching and the checkpoint/death rule already in the checkpoint spec, the autopsy card after each fix, the morning meeting and postmortem at the end, the server-room transition, and save/resume in localStorage. Link to the existing specs (editor, runner, monster-ai, bug-pack-validation, checkpoint, postmortem) instead of repeating them.
In tasks.md, the FIRST milestone must be a vertical slice, broken into small tasks with acceptance checks:
"Vertical slice — Act 1 with Null Ghost on the live site: the player sprite walks the office with collisions from office.json, the camera follows, the player can enter/leave hide spots, Null Ghost spawns and uses MonsterAI, the laptop opens only when hidden, pack 01 (profile.js) can be fixed in Monaco, tests pass, the ghost dissolves, the autopsy card shows."
Then list the later milestones in this order: Act 1 complete (Off-by-One) → Act 2 (Infinite Crawler, Async Phantom with the async test runner and per-test timeout, Memory Leech) → Act 3 (Race Twins, Deadlock) → server room + Legacy (multi-file pack) → morning meeting + postmortem + Sudo portrait + sound → polish.
Do not implement any game code in this part.

PART 3 — UI kit
The owner chose this UI kit. Recreate it as clean pixel art in our sprite pipeline (do NOT slice or copy the image itself: it is not pixel-perfect and its licence is unknown; do not put it in the repo):
<local reference folder>/ref-ui.png
Match it as closely as possible: same shapes, colours (purple primary, light beige secondary, tan/brown tertiary, cream panels with dark brown outline and small corner rivets), same states (normal, pressed/darker, disabled/grey).
- Buttons as 9-slice pieces (so any label length works) in 3 colours × 3 states; the label is drawn by the game with a pixel font, not baked in.
- Square icon buttons (about 24x24 at 1x): settings gear, speaker, music note, fullscreen, help ?, info i, save floppy, exit door, jack-o'-lantern, code </>, terminal >_, folder.
- Tabs (active purple with a small pointer, inactive tan), a dialog panel (9-slice) with corner rivets and a "more" arrow, a menu list panel with a purple selected row and a ▶ cursor, checkbox (empty/checked), radio (empty/selected), a progress bar (frame + purple fill), hearts (full/empty), a coin/counter pill, a vertical scrollbar (track, thumb, up/down arrows), and the small terminal-screen icon used in the dialog.
- Pick a free pixel font with an OFL or CC0 licence that looks like the reference (blocky, readable), add it to public/fonts/ with its licence file, and list it in README.
- Output PNGs to public/sprites/ui/, sources in scripts/sprites/src/ui/, a build step (extend build-sprites or add build-ui), and docs/art/ui-preview.png that reassembles the full reference layout from your pieces (with real labels in the pixel font: PLAY, SETTINGS, QUIT, INVENTORY, QUESTS, "A new quest has appeared!", Continue / New Game / Settings / Quit, "Fix the error?" Yes / No, 123) on the same cream background, at 2x, so it can be compared side by side with the reference.
- Open docs/art/ui-preview.png and compare it to the reference; fix and re-run until it matches.

FINISH
- npx vitest run and npm run build must pass after every part.
- Print a short summary per part: files changed, decisions written, and anything you are not happy with.
````

## Kiro's final summary

All three parts are committed locally and nothing is pushed. `npx vitest run` (28 tests) and `npm run build` passed after each commit.

## Part 1: steering (`37ab6e7`)
- **Files:** `product.md`, `project.md`, `tech.md`, plus the "~60s" wording in the editor spec.
- **Decisions written:**
  - **Scope and flow:** all 8 monsters ship, with cut order Memory Leech then Deadlock. One bug is active at a time, and Race Twins are a pair. The Deadlock golems guard the door from Act 3. The laptop opens only inside a hide spot and the world keeps running. Play time is 15–20 minutes with the first monster within 2 minutes.
  - **Map, characters, sound:** the office plus a SERVER ROOM, with the final fight in the red-lit server room. The player and Sudo looks are fixed. Ambience and music are CC0 only, and short SFX are synthesised with Web Audio.
- **Removed:** the old "single floor", "60 seconds" and "no more than one floor" lines. The out-of-scope list now says "more than two rooms".

## Part 2: game-flow spec (`5c3fa5e`)
- **Files:** `.kiro/specs/game-flow/` with `requirements.md` (EARS), `design.md` and `tasks.md`. It links the six existing specs instead of repeating them. No game code was written.
- **Tasks:** the first milestone is the Null Ghost vertical slice, split into small tasks with acceptance checks. The later milestones follow your order.
- **Assumption to check:** I read "one active bug" as the golems being visible at the door from the start of Act 3 but static. Deadlock becomes the active bug only after Race Twins are fixed.

## Part 3: UI kit (`d8b8ee3`)
- **Files:**
  - **Output:** 63 PNGs and `ui.json` (9-slice margins and label colours) in `public/sprites/ui/`, and `docs/art/ui-preview.png` (1008×672, 2x).
  - **Build:** sources in `scripts/sprites/src/ui/`, `scripts/sprites/draw/draw-ui.mjs`, `scripts/sprites/build-ui.mjs`, and the `draw-ui` and `build-ui` npm scripts.
  - **Font and docs:** Press Start 2P (OFL) with its licence in `public/fonts/`, a credits table in the README, and the dev log entry.
- **Reference check:** I compared the preview with the reference over several rounds. I fixed a font baseline off by one that clipped letters, and I redrew the gear, speaker, floppy, code and folder icons.
- **New dev dependency:** `opentype.js`, used to read the font outlines.
- **Not copied:** the reference image is not in the repo and none of it was sliced.

## Not happy with
- **Wider text:** Press Start 2P is wider than the reference font, so the dialogs and tabs are wider than in the reference. The labels also can't be as small as the reference text.
- **Smaller buttons:** buttons and icons are 24 px, as you asked, so they sit smaller in their slots than the reference.
- **Icon detail:** the pumpkin mouth and the floppy are only passable at 16 px.
- **Rivets:** the dialog panel's rivets are close to invisible at 1x.
- **Part 3 log hash:** the Part 3 entry in `docs/KIRO_LOG.md` says "pending". Per the log rule, the next entry fills in `d8b8ee3`.

## Owner feedback

Pending. No owner feedback was recorded yet. The summary asks the owner to check one assumption: Deadlock golems are visible but static from Act 3, and Deadlock becomes the active bug only after Race Twins are fixed.
