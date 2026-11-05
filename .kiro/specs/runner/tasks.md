# Tasks: Web Worker Code Runner

## Implementation tasks

- [x] Create `src/worker/codeRunner.ts` with `runCode(playerCode, testCode): Promise<RunResult>`
- [x] Implement inline Blob Worker with `new Function` execution
- [x] Implement 5000ms timeout with worker termination and URL revocation
- [x] Define `RunResult` interface (`passed`, `output`, `error`)
- [x] Integrate `runCode` into `LaptopScene` with "Running…" / pass / fail feedback

## Acceptance tests

- [ ] Fix null check → click Run → three ✓ lines, "Monster defeated."
- [ ] Partial fix → some ✓ some ✗, no "Monster defeated."
- [ ] Write `function getUserCity(user {` → descriptive syntax error, no crash
- [ ] Write `while(true){}` → after 5s: timeout message, page still responsive
- [ ] After timeout → run again immediately → works
