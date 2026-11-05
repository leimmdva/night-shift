# Tasks: Bug Pack Validation

## Implementation tasks

- [x] Create `scripts/validate-pack.js` (Node ESM, worker_threads sandbox)
- [x] Add `"validate-packs": "node scripts/validate-pack.js"` to `package.json`
- [x] Create `.kiro/hooks/validate-bug-pack.json` with correct Kiro hook format (PostFileSave)
- [x] Validate 01-null-ghost: ✓
- [x] Validate 02-off-by-one: ✓
- [x] Validate 03-infinite-crawler: ✓
- [ ] Add hook to CI: `npm run validate-packs` in GitHub Actions build step
- [ ] Write remaining 5 bug packs and validate each

## Acceptance tests

- [x] All 3 current packs pass `npm run validate-packs`
- [ ] Setting `brokenCode = solutionCode` → hook fails with "brokenCode passes all tests"
- [ ] Removing a required field → hook fails with field name
- [ ] Setting `solutionCode` to wrong answer → hook fails with failing test names
