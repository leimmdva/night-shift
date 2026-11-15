# Night Shift

> Bugs come alive at night. Fix them before dawn.

A browser-based 2D horror game for [Kiroween 2026](https://kiro.dev/kiroween).

Monsters roam the office. Each one carries the name of a buggy file.
Hide, open your laptop, fix the real JavaScript code, run the tests — the monster disappears.

**[Play the demo →](https://leylamammadova.github.io/night-shift/)**

---

## Built with

- [Phaser 3](https://phaser.io) — 2D game engine
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — in-game code editor
- [Vite](https://vitejs.dev) — build tool
- [Vitest](https://vitest.dev) + [fast-check](https://fast-check.io) — testing

## How Kiro was used

Full dated record: [docs/KIRO_LOG.md](docs/KIRO_LOG.md). Every Kiro session (prompt, summary, commits, owner feedback) has its own file in [docs/kiro-sessions/](docs/kiro-sessions/). Run `npm run check-submission` to check the Kiroween submission rules offline.

- **Steering:** eight always-included files in `.kiro/steering/` fix scope, tech stack, folder layout, Sudo's voice, the bug pack format, the dev-log rule and the Kiroween submission rules.
- **Specs:** seven systems (editor, runner, monster-ai, bug-pack-validation, checkpoint, postmortem, game-flow) each have requirements, design and tasks files.
- **Hook:** `validate-bug-pack` runs on save and rejects a pack whose tests do not fail on the broken code or do not all pass on the solution.
- **MCP:** `context7` (library docs) and `playwright` (browser checks) are configured in `.kiro/settings/mcp.json`.
- **Custom agent:** `bug-pack-generator` is defined to produce new packs that pass the validator.
- **Vibe coding:** the game skeleton, monster behaviour utilities (28 unit tests) and the sprite build script were generated in chat sessions.
- **Corrections:** the first hook format and single-file specs were wrong and were fixed on 2026-11-05.

## Credits

| Asset | Source | Licence |
|---|---|---|
| `public/fonts/PressStart2P-Regular.ttf` (UI pixel font) | [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) by CodeMan38 | SIL OFL 1.1, text in `public/fonts/PressStart2P-OFL.txt` |
| `public/sprites/ui/` (UI kit) | Drawn for this project by `scripts/sprites/draw/draw-ui.mjs` (`npm run build-ui`); layout inspired by a reference image that is not in the repo | Project licence (MIT) |
| Ambience and music | None added yet. Only CC0 files will be used; each file and its source will be listed here | CC0 |

Short sound effects are synthesised in code with Web Audio and use no files.

## Run locally

```bash
npm install
npm run dev
```

## License

MIT
