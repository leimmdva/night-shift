# Tasks: Code Editor (Monaco)

## Implementation tasks

- [x] Create `src/editor/monacoLoader.ts` with `preloadMonaco()`, `getMonaco()`, `mountEditor()`
- [x] Configure `vite.config.ts` with `vite-plugin-monaco-editor`, `languageWorkers: []`
- [x] Define `nightshift` theme in `monacoLoader.ts`
- [x] Call `preloadMonaco()` in `src/main.ts` before `startGame()`
- [x] Integrate `mountEditor()` into `LaptopScene` with "Laptop booting…" placeholder
- [x] Call `editor.dispose()` and remove DOM container in `LaptopScene.closeLaptop()`

## Acceptance tests

- [ ] Open game, immediately press E → "Laptop booting…" appears briefly or not at all
- [ ] Monaco editor appears with broken code content
- [ ] Typing in editor works, no autocomplete dropdown appears
- [ ] Close with ESC, reopen → editor shows original broken code
- [ ] No console errors related to Monaco after close
- [ ] Lighthouse on live deploy: Monaco chunk loads before first monster (within 2 min)
