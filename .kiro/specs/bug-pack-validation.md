# Spec: Bug Pack Validation Hook

## Goal
Automatically verify every bug pack before it can be merged or loaded by the game.
A pack with a broken test suite or missing fields must never reach the player.

## Trigger
The hook runs:
- On every save of a file inside `src/bugs/*/` (dev-time, via Kiro hook config)
- As a pre-commit check (enforced in CI via `npm run validate-packs`)

## What the hook validates

### 1. Structure check
- [ ] Folder contains exactly: `index.ts`
- [ ] `index.ts` exports a default object that satisfies the `BugPack` type
- [ ] All required fields are present: `id`, `order`, `monster`, `hints`, `autopsy`, `morning`, `brokenCode`, `testCode`, `solutionCode`
- [ ] `hints` array has exactly 3 entries (no more, no less)
- [ ] `morning.answers` array has exactly 3 entries
- [ ] `morning.correct` is 0, 1, or 2
- [ ] `id` matches the folder name (e.g. folder `01-null-ghost` → id `null-ghost`)

### 2. Test suite against broken code
- [ ] Run `testCode` against `brokenCode` in a Node.js child process (same sandbox as the game's Worker)
- [ ] Assert that **at least one test FAILS**
- [ ] If all tests pass on broken code → hook fails with:
  `ERROR [null-ghost] brokenCode passes all tests — the bug is not present`

### 3. Test suite against solution code
- [ ] Run `testCode` against `solutionCode`
- [ ] Assert that **all tests PASS**
- [ ] If any test fails on solution code → hook fails with:
  `ERROR [null-ghost] solutionCode fails tests — solution is incorrect`

### 4. Hint quality (warning only, not blocking)
- [ ] Each hint string is non-empty
- [ ] Hints are in order: location → type → solution
- [ ] Warn if any hint is longer than 120 characters

## Output format

On success:
```
✓ null-ghost  broken:1/3 fail  solution:3/3 pass
```

On failure:
```
✗ null-ghost
  ERROR: brokenCode passes all tests — the bug is not present
  Run the tests manually: node scripts/validate-pack.js 01-null-ghost
```

## Implementation

File: `scripts/validate-pack.js` (plain Node.js, no TypeScript compilation needed)

Usage:
```bash
node scripts/validate-pack.js              # validate all packs
node scripts/validate-pack.js 01-null-ghost  # validate one pack
```

Added to `package.json`:
```json
"scripts": {
  "validate-packs": "node scripts/validate-pack.js"
}
```

## Kiro hook config (`.kiro/hooks/validate-bug-pack.json`)
```json
{
  "trigger": "file-save",
  "pattern": "src/bugs/**/*.ts",
  "command": "node scripts/validate-pack.js",
  "on-error": "show-in-editor"
}
```

## Acceptance tests

### Happy path
1. Pack has correct broken/solution/tests. Hook runs. Output: ✓

### Bug not present in broken code
1. Set `brokenCode` = `solutionCode` (bug already fixed).
2. Hook runs. Output: ✗ with "brokenCode passes all tests".

### Solution is wrong
1. Set `solutionCode` to return `undefined` instead of `null`.
2. Hook runs. Output: ✗ with "solutionCode fails tests".

### Missing field
1. Remove `autopsy.impact` from `index.ts`.
2. Hook runs. Output: ✗ with field name listed.
