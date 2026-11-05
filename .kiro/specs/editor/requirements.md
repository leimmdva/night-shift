# Requirements: Code Editor (Monaco)

## Functional Requirements

### Loading
- WHEN the game boots THE SYSTEM SHALL call `preloadMonaco()` once from `src/main.ts`
- WHEN Monaco is imported THE SYSTEM SHALL load it as a separate Vite chunk, not bundled with game code
- WHEN Monaco loads THE SYSTEM SHALL NOT load any TypeScript language worker (`languageWorkers: []`)
- WHEN `getMonaco()` is called multiple times THE SYSTEM SHALL return the same promise (singleton)
- WHEN the player opens the laptop before Monaco is ready THE SYSTEM SHALL display "Laptop booting…" in the editor container until the promise resolves
- WHEN loading on Slow 4G THE SYSTEM SHALL resolve the "Laptop booting…" state within 60 seconds

### Editor instance
- WHEN an editor is mounted THE SYSTEM SHALL set language to `javascript`
- WHEN an editor is mounted THE SYSTEM SHALL apply the `nightshift` dark theme
- WHEN an editor is mounted THE SYSTEM SHALL disable `quickSuggestions`, `suggestOnTriggerCharacters`, and `parameterHints`
- WHEN an editor is mounted THE SYSTEM SHALL enable `automaticLayout` so it resizes with its container
- WHEN the laptop opens THE SYSTEM SHALL seed the editor with `pack.brokenCode`
- WHEN the laptop closes THE SYSTEM SHALL call `editor.dispose()` and remove the DOM container

## Non-Functional Requirements
- WHEN the editor is disposed THE SYSTEM SHALL leave no Monaco instances in memory
- WHEN the player closes and reopens the laptop THE SYSTEM SHALL show the original broken code, not the previously edited version
