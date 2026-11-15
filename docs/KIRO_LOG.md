# Night Shift — Kiro development log

Night Shift is a browser-based 2D horror game built for Kiroween 2026. Monsters carry the name of a buggy JavaScript file. The player hides, opens an in-game laptop, fixes the real code in a Monaco editor, runs tests in a sandboxed Web Worker, and the monster disappears. Each fix ends with an autopsy card, and a run ends with a postmortem report.

This file records how Kiro was used to build it. Entries are dated and tied to commits. Entries 2026-10-31 to 2026-11-15 were backfilled on 2026-11-15 from `git log`; details that were not recorded at the time are marked "TBD".

## Kiro features in this repo

| Feature | Path | What it does | Concrete example of its effect |
|---|---|---|---|
| Steering | `.kiro/steering/project.md` | Project scope, language rules, Sudo's voice, submission checklist | Keeps scope fixed (no multiplayer, no runtime LLM calls, no Monaco TS worker) across sessions |
| Steering | `.kiro/steering/product.md` | Goal, player, in/out of scope, success criteria | Defines 8 monsters and 4 acts as the boundary for the base game |
| Steering | `.kiro/steering/tech.md` | Stack, Monaco loading strategy, worker sandbox, performance targets | Source of the "no language workers" and "terminate worker after 5000 ms" rules |
| Steering | `.kiro/steering/structure.md` | Folder layout and naming conventions | Bug packs are named `NN-kebab-name` and monster IDs match folder names |
| Steering | `.kiro/steering/voice.md` | In-game English text, Sudo's three hint levels, autopsy card, morning meeting | Pack hints are three entries (location, type, solution) written in Sudo's voice |
| Steering | `.kiro/steering/bug-pack.md` | Bug pack manifest shape and validation contract | Defines the `BugPack` fields that `src/types/BugPack.ts` and the validator check |
| Steering | `.kiro/steering/dev-log.md` | Always-included rule: append a Timeline entry here after every change | Created with this log |
| Specs (6) | `.kiro/specs/{editor,runner,monster-ai,bug-pack-validation,checkpoint,postmortem}/` | Each has `requirements.md`, `design.md`, `tasks.md` | `monster-ai` spec was rewritten in `8a2a139` and then implemented as `behaviourUtils.ts` with 28 unit tests |
| Hook | `.kiro/hooks/validate-bug-pack.json` | On save of `src/bugs/**/*.ts`, runs `node scripts/validate-pack.js` | The script fails a pack whose tests do not fail on `brokenCode` or do not all pass on `solutionCode`. Current output: `03-infinite-crawler` broken run errors out (counted as fail), solution passes 4/4 |
| MCP | `.kiro/settings/mcp.json` | Two stdio servers: `context7` (library docs for Phaser, Monaco, Vite, Vitest) and `playwright` (browser automation for E2E checks) | Configured in `d49ba4d`. No record yet of a specific change caused by either server: TBD |
| Custom agent | `.kiro/agents/bug-pack-generator.md` | Generates a bug pack `index.ts` from a plain-language bug description and checks it with `npm run validate-packs` | Defined in `d49ba4d`. No pack has been generated with it yet: TBD |

Not present in the repo: powers, skills, `.kiro/hooks` other than the one above.

## Timeline

### 2026-10-31 — Project skeleton and steering files
- What: Vite + TypeScript + Phaser skeleton (BootScene, OfficeScene, LaptopScene), Monaco loader, worker-based code runner, deploy workflow, and five steering files.
- Kiro feature: steering, vibe coding
- How Kiro helped: generated the skeleton and the steering documents. Which parts were edited by hand: TBD (not recorded).
- Problems and fixes: none recorded.
- Commit: ab47c14 (skeleton, `project.md`), 88602c2 (steering + GitHub Pages workflow), 6382b98 and 111d175 (initial commit and merge)

### 2026-10-31 — BugPack type and first bug pack
- What: `BugPack` type, pack `01-null-ghost`, LaptopScene wired to load a pack (+271/−77 lines).
- Kiro feature: steering (`bug-pack.md`), vibe coding
- How Kiro helped: the pack shape follows `bug-pack.md`. Note that the pack stores `brokenCode`, `solutionCode` and tests inside `index.ts`, not as separate `.js` files as `structure.md` describes. Whether to reconcile the two: TBD.
- Problems and fixes: none recorded.
- Commit: a555538

### 2026-11-01 — System specs
- What: six spec documents (editor, runner, monster-ai, bug-pack-validation, checkpoint, postmortem), 457 lines.
- Kiro feature: spec
- How Kiro helped: drafted the specs as single files. They did not follow Kiro's requirements/design/tasks layout (fixed on 2026-11-05).
- Problems and fixes: see 2026-11-05.
- Commit: 4c39a5e

### 2026-11-01 — Bug pack validation script and hook
- What: `scripts/validate-pack.js`, `npm run validate-packs`, and the `validate-bug-pack` hook.
- Kiro feature: hook, spec (bug-pack-validation)
- How Kiro helped: generated the script and hook. The hook file used an incorrect format at this point.
- Problems and fixes: hook format corrected on 2026-11-05.
- Commit: d8c685e

### 2026-11-05 — Bug packs 02 and 03
- What: `02-off-by-one` and `03-infinite-crawler`.
- Kiro feature: steering (`bug-pack.md`), hook (validation), vibe coding
- How Kiro helped: packs written against the manifest format. Validator output today: 02 broken 4/4 tests fail, solution 4/4 pass. 03 broken code errors out (counts as fail), solution 4/4 pass. Whether the hook was run on save at the time: TBD.
- Problems and fixes: none recorded.
- Commit: e348eb0

### 2026-11-05 — Fix hook format, split specs, add MCP config and agent
- What: hook rewritten to Kiro's v1 format (`PostFileSave` trigger with matcher); six specs split into `requirements.md` / `design.md` / `tasks.md` folders; `.kiro/settings/mcp.json` (context7, playwright); `.kiro/agents/bug-pack-generator.md`; first monster AI files (`MonsterAI.ts`, `MonsterBehaviours.ts`, `MonsterState.ts`).
- Kiro feature: hook, spec, MCP, agent
- How Kiro helped: restructured the specs and generated the AI skeleton. The hook and spec layout were corrected after the first versions did not match Kiro's format.
- Problems and fixes: the original hook format and single-file specs were wrong; both fixed in this commit.
- Commit: d49ba4d

### 2026-11-05 — Monster behaviour utilities and unit tests
- What: `behaviourUtils.ts` and 28 unit tests; monster-ai spec updated; behaviour text in packs 01 and 02 adjusted.
- Kiro feature: spec (monster-ai), vibe coding
- How Kiro helped: implemented the pure functions described in the spec and the Vitest tests. Property-based tests with fast-check: none written yet (the dependency is installed).
- Problems and fixes: none recorded.
- Commit: 8a2a139

### 2026-11-15 — Pixel-art sprites for all 8 monsters
- What: 14 PNG sprites (8 monsters plus parts such as crawler segments, twins, deadlock halves), generated from text sources by `scripts/sprites/build-sprites.mjs`; preview image in `docs/art/`.
- Kiro feature: vibe coding
- How Kiro helped: wrote the text-to-PNG build script and the ASCII sprite sources. Visual tuning by hand: TBD.
- Problems and fixes: none recorded. Sprites are not yet loaded by the game scenes (TBD, verify).
- Commit: a674312

### 2026-11-15 — Development log and steering rule
- What: added this file, the `dev-log.md` steering rule, and a "How Kiro was used" README section.
- Kiro feature: steering, vibe coding
- How Kiro helped: backfilled the timeline from `git log`; metrics measured by running `npm run build`, `npx vitest --run` and `npm run validate-packs`.
- Problems and fixes: none.
- Commit: 9e9136d

### 2026-11-15 — Sprites redrawn as detailed 2.5D pixel art
- What: all 14 sprites redrawn on bigger canvases (48x48 for most monsters) with a 3/4 top-down look: lit top, front and shadowed side planes, outlines, 4-step ramps, floor shadows. Drawing code lives in `scripts/sprites/draw/` (`npm run draw-sprites`); the PNG build limit is now 16 colours; preview regenerated.
- Kiro feature: vibe coding
- How Kiro helped: wrote a small shading toolkit (distance-field lighting, 3-face boxes) and the drawings, and judged each sprite from zoomed renders. Several rounds of redrawing by hand-tuned parameters (null-ghost hole, crawler head, golem padlock).
- Problems and fixes: shading the ghost with its hole made a shadow ring, so the hole is punched after shading. Crawler ring plates and the crawler head are still busy at 1x.
- Commit: 53b32f3
### 2026-11-15 — 2.5D office map preview with hiding spots and Halloween decor
- What: one-room office (20x14 tiles, 32px) drawn as 55 reusable pieces, composed by `scripts/sprites/build-office.mjs` (`npm run build-office`). Writes `src/game/maps/office.json` and three 2x previews in `docs/art/` (lit, night, annotated) plus a pieces sheet. Seven hide spots, player desk, server door, entrance, four monster spawns.
- Kiro feature: vibe coding
- How Kiro helped: wrote the drawing code, layout module, lighting passes and annotation overlay, and reviewed zoomed renders. A first session was cut by a time limit and a second one finished it.
- Problems and fixes: the doormat overlapped the EXIT sign (moved up); wall plants hid the windows (moved); annotation numbers were unreadable (enlarged). 11 floor tiles are more than 5.5 tiles from a hide spot. The skeleton still overlaps its desk.
- Commit: pending

## Decisions

- **Monaco in its own chunk, loaded in the background.** The player cannot open the laptop for about 60 seconds, so Monaco has time to load. Phaser and Monaco are separate chunks and load in parallel (`vite.config.ts` plus `vite-plugin-monaco-editor`).
- **No Monaco language workers.** Autocomplete would solve the puzzle for the player.
- **Player code runs in a fresh Web Worker, terminated after 5 s.** Infinite-loop bugs such as Infinite Crawler cannot freeze the page.
- **Bug packs are data, validated by a hook.** A pack must fail its tests on the broken code and pass them on the solution, so no pack ships unsolvable or already solved.
- **Monster behaviour mirrors the bug.** Behaviour logic is kept as pure functions in `behaviourUtils.ts` so it can be unit tested without Phaser.
- **No LLM calls at runtime.** Hints and autopsy text are pre-written for cost, latency and offline reliability.
- **Specs use the requirements/design/tasks layout.** Changed on 2026-11-05 after the first single-file specs did not match Kiro's format.

## Metrics

Measured on 2026-11-15.

| Metric | Value |
|---|---|
| Bug packs | 3 of 8 planned (01-null-ghost, 02-off-by-one, 03-infinite-crawler) |
| Packs passing `npm run validate-packs` | 3 of 3 |
| Unit tests | 28 (1 file, Vitest, all passing) |
| Property-based tests | 0 |
| E2E tests | 0 |
| Specs | 6 |
| Hooks | 1 |
| Steering files | 7 (including `dev-log.md`) |
| Custom agents | 1 |
| MCP servers | 2 |
| Monster sprites | 14 PNG files |
| Office sprites | 55 PNG pieces in `public/sprites/office/` (tiles and props) |
| Commits | 12 before this one |

Bundle sizes from the last `npm run build` (gzip):

| Chunk | gzip |
|---|---|
| `editor.api` (Monaco core) | 588.26 kB |
| `phaser` | 318.49 kB |
| `editor.main` (Monaco) | 244.40 kB |
| `index` (game code) | 4.57 kB |
| `index.html` | 0.72 kB |

The build also emits many small per-language Monaco chunks (2–11 kB gzip each) and two editor CSS files (about 11 kB gzip each). Vite warns that three chunks exceed 500 kB before gzip. Lighthouse and Slow 4G measurements on the live deploy: TBD.

## Open issues / next steps

- Bug packs 04 to 08 are not written (async-phantom, memory-leech, race-twins, deadlock, legacy).
- Pack storage differs from `structure.md` and `bug-pack.md` (single `index.ts` instead of four files). Update either the docs or the packs.
- Sprites exist but their use in OfficeScene is unverified: TBD.
- No property-based tests (fast-check) and no Playwright E2E tests yet.
- Morning meeting, autopsy card and postmortem UI: implementation status TBD.
- The `bug-pack-generator` agent and the two MCP servers have not been exercised in a recorded session. Record the first real use here.
- Performance targets (FCP under 3 s, interactive under 5 s on Slow 4G) are not measured.
- At least 3 external playtests, demo video and social post are still open from the submission checklist.
