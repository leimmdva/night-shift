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

Full dated record: [docs/KIRO_LOG.md](docs/KIRO_LOG.md).

- **Steering:** seven always-included files in `.kiro/steering/` fix scope, tech stack, folder layout, Sudo's voice and the bug pack format.
- **Specs:** seven systems (editor, runner, monster-ai, bug-pack-validation, checkpoint, postmortem, game-flow) each have requirements, design and tasks files.
- **Hook:** `validate-bug-pack` runs on save and rejects a pack whose tests do not fail on the broken code or do not all pass on the solution.
- **MCP:** `context7` (library docs) and `playwright` (browser checks) are configured in `.kiro/settings/mcp.json`.
- **Custom agent:** `bug-pack-generator` is defined to produce new packs that pass the validator.
- **Vibe coding:** the game skeleton, monster behaviour utilities (28 unit tests) and the sprite build script were generated in chat sessions.
- **Corrections:** the first hook format and single-file specs were wrong and were fixed on 2026-11-05.

## Run locally

```bash
npm install
npm run dev
```

## License

MIT
