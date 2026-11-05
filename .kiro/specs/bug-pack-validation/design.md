# Design: Bug Pack Validation

## Components

```
.kiro/hooks/validate-bug-pack.json   — PostFileSave hook, matcher: src/bugs/.+\.ts$
scripts/validate-pack.js             — Node.js validator (plain ESM, no compilation)
package.json "validate-packs"        — npm script alias
```

## Validation flow

```
validate-pack.js
  └─ listPackFolders() OR use argv[2]
  └─ for each folder:
       1. Parse index.ts (regex-strip TypeScript, eval with new Function)
       2. Check required fields
       3. Check id === folder name (strip NN- prefix)
       4. Check hints.length === 3
       5. Check morning.answers.length === 3, correct in [0,1,2]
       6. runInWorker(brokenCode, testCode)  → assert ≥1 failure
       7. runInWorker(solutionCode, testCode) → assert all pass
       8. Print result line
```

## Worker sandbox (Node.js `worker_threads`)
Same logic as the browser Web Worker — `new Function` inside a worker, 5000ms timeout.
The `03-infinite-crawler` pack has a call-count guard in its testCode to prevent the Node validator from hanging.

## Current status
```
✓ 01-null-ghost       broken:2/3 fail   solution:3/3 pass
✓ 02-off-by-one       broken:4/4 fail   solution:4/4 pass
✓ 03-infinite-crawler broken:error      solution:4/4 pass
```
