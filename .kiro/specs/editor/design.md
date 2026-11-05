# Design: Code Editor (Monaco)

## Architecture

```
main.ts
  └─ preloadMonaco()          ← fires at game boot, background
       └─ import('monaco-editor')
            └─ defineTheme('nightshift')
            └─ monacoPromise (singleton)

LaptopScene.create()
  └─ mountEditor(container, brokenCode)
       └─ getMonaco()         ← awaits singleton promise
       └─ monaco.editor.create(container, options)
       └─ returns IStandaloneCodeEditor

LaptopScene.closeLaptop()
  └─ editor.dispose()
  └─ container.remove()
```

## Key decisions

**No language workers:** `vite-plugin-monaco-editor` is configured with `languageWorkers: []`. This removes the `typescript-language-features` worker (~3MB), keeping the Monaco chunk small and preventing autocomplete from solving puzzles for the player.

**Background preload:** `preloadMonaco()` is called before Phaser boots. By the time the first monster appears (~60s), Monaco is fully loaded. The "Laptop booting…" state is a themed animation, not a loading spinner.

**Singleton promise:** `monacoPromise` is a module-level variable. Every call to `getMonaco()` returns the same promise — Monaco is only imported once.

## Theme: `nightshift`
- Background: `#0d1117` (GitHub dark)
- Foreground: `#c9d1d9`
- Line numbers: `#484f58`
- Matches the office scene palette for visual continuity
