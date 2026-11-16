# Session 03 of 2026-11-16: Vertical slice (Act 1 with Null Ghost)

- Date: 2026-11-16
- How Kiro was run: Kiro IDE, non-interactive session, on branch `feat/vertical-slice` (not pushed, not merged).
- Commit(s): listed under "Resulting commits" below.

## Prompt given to Kiro

````markdown
Implement the first milestone of .kiro/specs/game-flow/tasks.md: the VERTICAL SLICE (Act 1 with Null Ghost). Read the game-flow, monster-ai, editor, runner and checkpoint specs and the steering files first, and follow them.

Work on a new branch `feat/vertical-slice` (create it from main). Make one small, self-contained commit per task in tasks.md (Conventional Commits; the build must pass after every commit), and tick each task in tasks.md when its acceptance check passes. Do not push and do not merge.

Goal — on `npm run dev` (and later the live site) the owner sees this loop with the approved art:
1. The office from src/game/maps/office.json, drawn with the approved tiles and props in public/sprites/office/ (lights-on look of docs/art/office-preview.png), with collisions on walls and furniture.
2. A player sprite: the gender-neutral junior dev in a hoodie with headphones and a flashlight, drawn in the same 2.5D pixel-art style and pipeline as the monsters (scripts/sprites/, 4 directions: down, up, side (mirrored for the other side), 2 walk frames + 1 idle each). Moves with WASD/arrows at a comfortable speed; the camera follows within the room bounds at an integer zoom so pixels stay crisp.
3. Hide spots from office.json: when the player stands at one, a prompt "E — hide" appears (pixel font, UI kit dialog style); hiding makes the player invisible to monsters and shows a hidden state (dimmed vignette). E again leaves.
4. Null Ghost spawns at one of office.json monsterSpawns (never within 6 tiles of the player's desk) about 20–40 s after start, uses MonsterAI with its behaviour (alpha 0.4, full in the player's view cone), its red file label "profile.js" above it, and catches the player on contact (checkpoint rule from the checkpoint spec: wake at the last hide spot, +1 hint).
5. The laptop opens only while hidden (E/L, as the spec says). While it is open the world keeps running: the ghost searches and can be heard, but cannot catch the hidden player.
6. In the laptop: pack 01 (profile.js) in Monaco, RUN TESTS runs the existing worker runner, HINT shows Sudo's hints. When all tests pass: the laptop shows success, the ghost plays a "dissolve" (fills in, then fades) and the autopsy card from pack 01 appears in the UI kit dialog style.
7. Use the UI kit (public/sprites/ui/, ui.json 9-slice, Press Start 2P) for prompts, the autopsy card and the laptop buttons.

Also fix these two known issues as part of the slice:
- Monaco logs "Could not create web worker(s)" and requests /undefined (404). Since we use no language workers, configure MonacoEnvironment.getWorker / getWorkerUrl so the editor worker loads correctly (or is intentionally disabled without errors), and stop the typescript/tsMode chunks from loading if they are not needed. Verify in the browser console: no warnings, no 404s.
- Remove the spoiler comments from brokenCode in all existing packs (e.g. "// Bug: address can be null…", "attempts is never incremented here"). Broken code must look like a real file. The validate-packs hook must still pass.

Verify before finishing:
- npx vitest run, npm run validate-packs, npm run build, npm run check-submission all pass. Add unit tests for any new pure logic (hide-spot detection, spawn selection respecting the 6-tile rule, the laptop-only-when-hidden rule).
- Run the game with `npm run dev` and drive it with the Playwright MCP server from .kiro/settings/mcp.json (or a Playwright script): start, walk to a hide spot, hide, open the laptop, type the fix `return user.address?.city ?? null`, run tests, see the ghost dissolve and the autopsy card. Save screenshots of each step to docs/art/slice/ (01-office.png … 06-autopsy.png). Look at them yourself; fix anything that looks wrong.
- Follow the dev-log steering rule (session file + Timeline entries, Owner feedback: pending).
- Print: the list of commits on the branch, what works, what does not yet, and anything you are not happy with.

Work in passes and commit often: this session may be cut off, and partial progress must always be on disk and committed.
````

## Kiro's summary

Done on `feat/vertical-slice` (not pushed, not merged), one commit per task group, build and tests green at each commit:

- Pure logic with unit tests: `src/state/runState.ts`, `src/game/flow/queue.ts`, `src/game/flow/spawner.ts` (6-tile desk rule, fast-check property), `src/game/world/{collision,hiding,nav}.ts`, `src/state/checkpoint.ts`.
- `RoomScene` / `OfficeScene` draw the office from `office.json` (lights-on look), `HudScene` (prompt, vignette, toast, autopsy card) and `LaptopScene` use the UI kit and Press Start 2P.
- Player sprite: `scripts/sprites/draw/player.mjs`, `build-player.mjs`, preview in `docs/art/player-preview.png`.
- Null Ghost: `MonsterActor`, `factory.ts`, MonsterAI with path finding and line of sight; two MonsterAI fixes so hidden players are ignored.
- Monaco: `edcore.main` plus the JavaScript tokenizer and the plain editor worker; the plugin `vite-plugin-monaco-editor` was removed. No console warning, no 404.
- Spoiler comments removed from packs 01 to 03; `npm run validate-packs` passes.
- `scripts/e2e-slice.mjs` (npm run e2e-slice) passes on the dev server and on `vite preview` (natural 34 s spawn). Screenshots are in `docs/art/slice/`.

Not done: task 1.6 "verify the Vercel deploy" (needs the owner's push). Everything after the slice (title screen, queue, acts 2 to 3, server room, morning meeting, sound) is untouched.

Not happy with: the player art is a first pass (small headphones, legs hidden by the shoes, side view reads thin); the ghost's SEARCH state hovers 90 to 100 px from the hide spot instead of walking to it; the empty lower part of the laptop panel; the 2x UI text at 1280 x 720 is large; the music and sound cues are placeholders (four Web Audio blips).

## Resulting commits

a63de0b, d0333d2, 42ec51a, d74e5cd, 6ef4731, 9710c56, cc6f7b8, ae5d896, 6a8655f, bdd1621, 438d8e3, plus the docs commits.

## Owner feedback

Owner feedback: pending
