# Night Shift — Kiro development log

Night Shift is a browser-based 2D horror game built for Kiroween 2026. Monsters carry the name of a buggy JavaScript file. The player hides, opens an in-game laptop, fixes the real code in a Monaco editor, runs tests in a sandboxed Web Worker, and the monster disappears. Each fix ends with an autopsy card, and a run ends with a postmortem report.

This file records how Kiro was used to build it. Entries are dated and tied to commits. Entries 2026-10-31 to 2026-11-05 were backfilled on 2026-11-15 from `git log`; details that were not recorded at the time are marked "TBD". From 2026-11-15 on, each session also has a file in [kiro-sessions/](kiro-sessions/) with the prompt, summary, commits and owner feedback. Earlier sessions: [kiro-sessions/before-2026-11-15-not-recorded.md](kiro-sessions/before-2026-11-15-not-recorded.md).

## Kiro features in this repo

| Feature | Path | What it does | Concrete example of its effect |
|---|---|---|---|
| Steering | `.kiro/steering/project.md` | Project scope, language rules, Sudo's voice, submission checklist | Keeps scope fixed (no multiplayer, no runtime LLM calls, no Monaco TS worker) across sessions |
| Steering | `.kiro/steering/product.md` | Goal, player, in/out of scope, success criteria | Defines 8 monsters and 4 acts as the boundary for the base game |
| Steering | `.kiro/steering/tech.md` | Stack, Monaco loading strategy, worker sandbox, performance targets | Source of the "no language workers" and "terminate worker after 5000 ms" rules |
| Steering | `.kiro/steering/structure.md` | Folder layout and naming conventions | Bug packs are named `NN-kebab-name` and monster IDs match folder names |
| Steering | `.kiro/steering/voice.md` | In-game English text, Sudo's three hint levels, autopsy card, morning meeting | Pack hints are three entries (location, type, solution) written in Sudo's voice |
| Steering | `.kiro/steering/bug-pack.md` | Bug pack manifest shape and validation contract | Defines the `BugPack` fields that `src/types/BugPack.ts` and the validator check |
| Steering | `.kiro/steering/dev-log.md` | Always-included rule: continuous, chronological record; one `docs/kiro-sessions/` file per session plus a Timeline entry | Rewritten 2026-11-16 to require session files and owner feedback |
| Steering | `.kiro/steering/kiroween-rules.md` | Always-included Kiroween submission rules | Checked offline by `npm run check-submission` |
| Specs (7) | `.kiro/specs/{editor,runner,monster-ai,bug-pack-validation,checkpoint,postmortem,game-flow}/` | Each has `requirements.md`, `design.md`, `tasks.md` | `monster-ai` spec was rewritten in `8a2a139` and then implemented as `behaviourUtils.ts` with 28 unit tests |
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
- Owner feedback: rejected. Too flat, too small, little character. The owner gave three style references (a glossy slime, a green creature with a strong outline and rim highlights, a detailed eyeball monster) and asked for static pixel art in that style. The references are not in the repo.
- Session: [2026-11-15-01-sprites-v1.md](kiro-sessions/2026-11-15-01-sprites-v1.md)
- Commit: a674312

### 2026-11-15 — Development log and steering rule
- What: added this file, the `dev-log.md` steering rule, and a "How Kiro was used" README section.
- Kiro feature: steering, vibe coding
- How Kiro helped: backfilled the timeline from `git log`; metrics measured by running `npm run build`, `npx vitest --run` and `npm run validate-packs`.
- Problems and fixes: none.
- Owner feedback: pending (none recorded).
- Session: [2026-11-15-02-dev-log.md](kiro-sessions/2026-11-15-02-dev-log.md)
- Commit: 9e9136d

### 2026-11-15 — Sprites in a detailed style (failed, then interrupted)
- What: second sprite attempt in the style of the three owner references; no commit.
- Kiro feature: vibe coding
- How Kiro helped: the retry studied the references, wrote a shading toolkit in `scripts/sprites/draw/` and drew the first sprites (kept uncommitted, reused in the next entry).
- Problems and fixes: the first attempt failed with a Kiro server error (`ModelRegistryUnavailableError`) before any work. The retry was stopped part-way when the owner asked to switch to a 2.5D look.
- Owner feedback: asked to redo in 2.5D (solid volumes from a top-down 3/4 camera) instead of the detailed flat style.
- Session: [2026-11-15-03-sprites-v2-detailed.md](kiro-sessions/2026-11-15-03-sprites-v2-detailed.md)
- Commit: none

### 2026-11-15 — Sprites redrawn as detailed 2.5D pixel art
- What: all 14 sprites redrawn on bigger canvases (48x48 for most monsters) with a 3/4 top-down look: lit top, front and shadowed side planes, outlines, 4-step ramps, floor shadows. Drawing code lives in `scripts/sprites/draw/` (`npm run draw-sprites`); the PNG build limit is now 16 colours; preview regenerated.
- Kiro feature: vibe coding
- How Kiro helped: wrote a small shading toolkit (distance-field lighting, 3-face boxes) and the drawings, and judged each sprite from zoomed renders. Several rounds of redrawing by hand-tuned parameters (null-ghost hole, crawler head, golem padlock).
- Problems and fixes: shading the ghost with its hole made a shadow ring, so the hole is punched after shading. Crawler ring plates and the crawler head are still busy at 1x.
- Owner feedback: accepted. These are the approved monster sprites.
- Session: [2026-11-15-04-sprites-v3-2-5d.md](kiro-sessions/2026-11-15-04-sprites-v3-2-5d.md)
- Commit: 53b32f3

### 2026-11-15 — Office map, first run (stopped by time limit)
- What: first session for the 2.5D office map. It wrote the office drawing toolkit (tiles, furniture, decor, layout module). No commit.
- Kiro feature: vibe coding
- How Kiro helped: drew the pieces and checked contact sheets by eye.
- Problems and fixes: the run hit the 10-minute time limit (SIGTERM, exit 143). Resuming that session failed with `SessionHeldElsewhereError`, so the work continued in a fresh session with a continuation prompt (next entry).
- Owner feedback: none for this run on its own.
- Session: [2026-11-15-05-office-map-v1.md](kiro-sessions/2026-11-15-05-office-map-v1.md)
- Commit: none

### 2026-11-15 — 2.5D office map preview with hiding spots and Halloween decor
- What: one-room office (20x14 tiles, 32px) drawn as 55 reusable pieces, composed by `scripts/sprites/build-office.mjs` (`npm run build-office`). Writes `src/game/maps/office.json` and three 2x previews in `docs/art/` (lit, night, annotated) plus a pieces sheet. Seven hide spots, player desk, server door, entrance, four monster spawns.
- Kiro feature: vibe coding
- How Kiro helped: wrote the drawing code, layout module, lighting passes and annotation overlay, and reviewed zoomed renders. A first session was cut by a time limit and a second one finished it.
- Problems and fixes: the doormat overlapped the EXIT sign (moved up); wall plants hid the windows (moved); annotation numbers were unreadable (enlarged). 11 floor tiles are more than 5.5 tiles from a hide spot. The skeleton still overlaps its desk.
- Owner feedback: replaced. The owner supplied a warm, cosy office illustration as a style reference (not in the repo) and asked for a rebuild in that style.
- Session: [2026-11-15-05-office-map-v1.md](kiro-sessions/2026-11-15-05-office-map-v1.md)
- Commit: a03044c

### 2026-11-15 — Office map rebuilt in a warm cosy style with Halloween decor
- What: redrew the office from a reference illustration: wood-plank floor, 3-tile cream back wall with wainscot, 16px thick side and bottom walls, brown furniture with warm shadows, bookshelves, credenza, wardrobe, rugs, dense desk clutter. New seated skeleton (profile, headset, legs under the desk). Eight hide spots, player desk moved to the right, spawns at least 6 tiles from it. Night preview gives each monster a light pool.
- Kiro feature: vibe coding
- How Kiro helped: wrote the new drawing code (`office-props2.mjs`), layout, compose changes and a reachability check that now also reports hide-spot coverage (max 5 tiles) and spawn distance. Layout was corrected by hand after viewing previews (isolated tile, doormat under EXIT sign, ghost spawn).
- Problems and fixes: one walkable tile beside the boxes was cut off (blocked by moving the stack); the doormat was narrowed to clear the EXIT pole. Side walls have a thin dark border, not as dark as the reference.
- Owner feedback: approved as is. The office map is final; do not restyle.
- Session: [2026-11-15-06-office-map-v2.md](kiro-sessions/2026-11-15-06-office-map-v2.md)
- Commit: 853d1f8

### 2026-11-15 — Owner decisions locked into steering
- What: `product.md`, `project.md`, `tech.md` now fix scope (all 8 monsters, cut order Memory Leech then Deadlock), one-active-bug flow, laptop-only-in-hide-spot rule, server room, player and Sudo look, sound policy (CC0 music, synthesised SFX), 15–20 min play time with first monster within 2 min. The editor spec's "~60s" first-monster wording was changed to "within 2 min".
- Kiro feature: steering
- How Kiro helped: found the contradicting lines ("single floor", "~60 seconds") and rewrote them. All decisions come from the owner.
- Problems and fixes: none.
- Owner feedback: pending (none recorded).
- Session: [2026-11-15-07-production-kickoff.md](kiro-sessions/2026-11-15-07-production-kickoff.md)
- Commit: 37ab6e7

### 2026-11-15 — Game-flow spec
- What: `.kiro/specs/game-flow/` (requirements in EARS, design, tasks) for the whole run: title, acts, one-bug queue, spawn rules, hiding and laptop rule, catch, autopsy, server room, morning meeting, save/resume. Tasks start with the Act 1 / Null Ghost vertical slice. No game code.
- Kiro feature: spec
- How Kiro helped: drafted the three files and linked the six existing specs instead of repeating them. Queue, spawn distances and the (9,4) spawn at about 6.7 tiles from the desk were checked against `office.json`.
- Problems and fixes: the requirements say Deadlock golems are static in GUARD state and Deadlock becomes the active bug after Race Twins; this reading of "one active bug" is my assumption and needs the owner's check.
- Owner feedback: pending (none recorded).
- Session: [2026-11-15-07-production-kickoff.md](kiro-sessions/2026-11-15-07-production-kickoff.md)
- Commit: 5c3fa5e

### 2026-11-15 — UI kit pixel art
- What: 63 UI pieces (3 colours x 3 states of 9-slice buttons, 12 icon buttons, tabs, panel with rivets, menu row, checkbox, radio, progress bar, hearts, pill, coin, scrollbar, terminal icon) drawn in code, built to `public/sprites/ui/` with `ui.json` slice data. Press Start 2P (OFL) added to `public/fonts/`. `docs/art/ui-preview.png` rebuilds the reference layout at 2x. New scripts: `npm run draw-ui`, `npm run build-ui`; dev dependency `opentype.js`.
- Kiro feature: vibe coding
- How Kiro helped: wrote the generators and compared each preview with the reference. Fixes after viewing: text rows were clipped (font baseline off by one), several icons redrawn (gear, speaker, floppy, code, folder).
- Problems and fixes: Press Start 2P is wider than the reference font, so text panels are wider than in the reference. The reference image itself is not in the repo.
- Owner feedback: pending (none recorded).
- Session: [2026-11-15-07-production-kickoff.md](kiro-sessions/2026-11-15-07-production-kickoff.md)
- Commit: d8b8ee3

### 2026-11-16 — Session records, dev-log rule and Kiroween compliance check
- What: `docs/kiro-sessions/` with one file per session (8 sessions of 2026-11-15 backfilled from the logs, one file for the unrecorded earlier sessions); rewritten `dev-log.md` rule; new `kiroween-rules.md` steering; `scripts/check-submission.mjs` and `npm run check-submission`; README "Credits" heading and Kiro links; owner-feedback lines and session links on today's entries; owner decisions added below.
- Kiro feature: steering, vibe coding
- How Kiro helped: generated the session files from the saved prompts and logs with a throwaway script (removed), replacing local paths with placeholders, and wrote the check script. Checked Kiroween dates against public pages.
- Problems and fixes: the official rules page returned 403, so rules are checked only against search snippets and a 2025 summary. The 2026 period is 30 Oct to 4 Dec, which matches the 5 Dec 01:00 Türkiye cut-off. The 30 January demo date, the 3-minute video limit and the category requirement are not confirmed for 2026. The session 03 log had no error text, so the server error name comes from the owner.
- Owner feedback: pending.
- Session: [2026-11-15-08-session-records-and-compliance.md](kiro-sessions/2026-11-15-08-session-records-and-compliance.md) (file date is 2026-11-16 in its header)
- Commit: 8a76e4a

### 2026-11-16 — Move hosting from GitHub Pages to Vercel
- What: `base: '/'` in `vite.config.ts`, new `vercel.json` (build config, cache headers for `/assets`, `/sprites`, `/fonts`), removed the Pages workflow, updated steering, README and the game-flow tasks line.
- Kiro feature: steering, vibe coding
- How Kiro helped: found that no source file hard-codes the old base path, made the edits and ran the checks (28 tests, build, `check-submission`, preview returned 200 for `/`, a sprite and the font).
- Problems and fixes: the real Vercel URL is unknown, so the README link is the placeholder `https://night-shift.vercel.app`. The real deploy is not verified yet.
- Owner feedback: pending.
- Session: [2026-11-16-01-move-hosting-to-vercel.md](kiro-sessions/2026-11-16-01-move-hosting-to-vercel.md)
- Commit: pending

## Decisions

- **Monaco in its own chunk, loaded in the background.** The player cannot open the laptop for about 60 seconds, so Monaco has time to load. Phaser and Monaco are separate chunks and load in parallel (`vite.config.ts` plus `vite-plugin-monaco-editor`).
- **No Monaco language workers.** Autocomplete would solve the puzzle for the player.
- **Player code runs in a fresh Web Worker, terminated after 5 s.** Infinite-loop bugs such as Infinite Crawler cannot freeze the page.
- **Bug packs are data, validated by a hook.** A pack must fail its tests on the broken code and pass them on the solution, so no pack ships unsolvable or already solved.
- **Monster behaviour mirrors the bug.** Behaviour logic is kept as pure functions in `behaviourUtils.ts` so it can be unit tested without Phaser.
- **No LLM calls at runtime.** Hints and autopsy text are pre-written for cost, latency and offline reliability.
- **Specs use the requirements/design/tasks layout.** Changed on 2026-11-05 after the first single-file specs did not match Kiro's format.
- **Owner decisions of 2026-11-15 (final, in `product.md` and `project.md`).**
  - Scope: all 8 monsters ship. Last-resort cut order is Memory Leech, then Deadlock. Nothing else is cut.
  - Flow: one active bug at a time. Race Twins are one bug with two sprites. From Act 3 the Deadlock golems stand at the server door until `transfer.js` is fixed.
  - Laptop: it opens only inside a hide spot. The world keeps running, but a monster cannot catch a hidden player.
  - Length: a full run takes 15–20 minutes and the first monster appears within 2 minutes.
  - Rooms: the office and a small server room. The final fight (Legacy) is in the narrow, red-lit server room.
  - Look: the monster sprites (53b32f3) and the office map (853d1f8) are approved. The player is a gender-neutral junior developer in a hoodie with headphones and a flashlight. Sudo is an amber-glowing ghost with glasses and a coffee mug, shown only as a portrait on the laptop screen.
  - Sound: ambience and music from CC0 sources only, listed in the README. Short SFX are synthesised with Web Audio, one signature per monster.
- **Hosting moved from GitHub Pages to Vercel on 2026-11-16.** GitHub Actions runs for the account stopped starting ("The job was not started because your account is locked due to a billing issue"), so the Pages deploy failed from commit 5c3fa5e on and the live site stayed on the 31 October build. Vercel (Hobby plan) is linked to the repo and deploys every push to `main`. Base URL is `/`; no GitHub Actions workflow.

## Metrics

Measured on 2026-11-15.

| Metric | Value |
|---|---|
| Bug packs | 3 of 8 planned (01-null-ghost, 02-off-by-one, 03-infinite-crawler) |
| Packs passing `npm run validate-packs` | 3 of 3 |
| Unit tests | 28 (1 file, Vitest, all passing) |
| Property-based tests | 0 |
| E2E tests | 0 |
| Specs | 7 |
| Hooks | 1 |
| Steering files | 8 (including `dev-log.md` and `kiroween-rules.md`) |
| Custom agents | 1 |
| MCP servers | 2 |
| Monster sprites | 14 PNG files |
| Office sprites | 66 PNG pieces in `public/sprites/office/` (tiles and props) |
| UI kit sprites | 63 PNG pieces in `public/sprites/ui/` |
| Commits | 18 before this one |

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
