# Spec: Code Editor (Monaco)

## Goal
Give the player a real code editor experience inside the game — keyboard-driven,
syntax-highlighted, no autocomplete — that loads without blocking gameplay.

## Requirements

### Loading
- [ ] `preloadMonaco()` is called once at game boot (`src/main.ts`)
- [ ] Monaco is loaded as a separate Vite chunk (not bundled with game code)
- [ ] No TypeScript language worker is loaded (`languageWorkers: []`)
- [ ] `getMonaco()` returns the same promise on repeated calls (singleton)
- [ ] If Monaco is not ready when the player opens the laptop, the editor container
      shows "Laptop booting…" text until the promise resolves
- [ ] The "Laptop booting…" state must resolve within 60 seconds on Slow 4G

### Editor instance
- [ ] Language: `javascript`
- [ ] Theme: `nightshift` (dark, defined in `monacoLoader.ts`)
- [ ] Font size: 13px, monospace
- [ ] Line numbers: on
- [ ] Minimap: off
- [ ] `quickSuggestions`: false
- [ ] `suggestOnTriggerCharacters`: false
- [ ] `parameterHints`: disabled
- [ ] `automaticLayout`: true (resizes with container)
- [ ] Editor is mounted into a DOM div overlaid on the Phaser canvas

### Initial content
- [ ] Editor is seeded with `pack.brokenCode` when LaptopScene is created
- [ ] The player can edit freely — no read-only regions
- [ ] Content is NOT persisted between laptop opens (fresh each time)

### Disposal
- [ ] `editor.dispose()` is called when LaptopScene closes
- [ ] The DOM container is removed from the document on close
- [ ] No Monaco instances remain after the laptop is closed

## Acceptance test
1. Open the game. Immediately press E.
2. "Laptop booting…" appears briefly (or not at all on fast connections).
3. Monaco editor appears with `profile.js` content.
4. Typing in the editor works. No autocomplete dropdown appears.
5. Close with ESC. Open again. Editor shows the original broken code (not the edited version).
6. No console errors related to Monaco after close.
