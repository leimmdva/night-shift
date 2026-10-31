# Spec: Web Worker Code Runner

## Goal
Run player-submitted JavaScript code safely — isolated from the main thread,
with a hard timeout — and return structured test results.

## Requirements

### Sandbox
- [ ] Player code runs inside a `new Worker(...)` — never on the main thread
- [ ] A new Worker is created for every run attempt (never reused)
- [ ] The Worker is created from an inline Blob URL (no separate worker file)
- [ ] Player code is executed via `new Function(playerCode + testCode + 'return __testResults__')`
- [ ] The Worker has no access to DOM, localStorage, or `fetch`

### Timeout
- [ ] Worker is terminated after exactly `TIMEOUT_MS = 5000` milliseconds
- [ ] On timeout, `runCode` resolves with `{ passed: false, error: 'timeout', output: '...' }`
- [ ] The Blob URL is revoked (`URL.revokeObjectURL`) whether the run succeeds or times out
- [ ] An infinite loop in player code must not freeze the page

### Test format (inline runner inside Worker)
The test code injected alongside player code defines:
- `test(name, fn)` — registers a test case
- `expect(val)` — returns a matcher object
- `__testResults__` — array of `{ name: string, ok: boolean, error?: string }`

All test code must follow this format (no external imports).

### Results
- [ ] `RunResult.passed` is `true` only when every test in `__testResults__` has `ok: true`
- [ ] `RunResult.output` is a newline-joined list of `✓ name` / `✗ name` lines
- [ ] `RunResult.error` is set on syntax errors, runtime exceptions, or timeout
- [ ] A syntax error in player code produces a descriptive error message (not a crash)

### UI feedback (LaptopScene responsibility, not runner)
- Output panel shows "Running…" while the Worker is active
- On pass: output turns green, "✓ All tests pass. Monster defeated." appended
- On fail: output turns red, error or failing test names shown
- On timeout: output shows timeout message

## Acceptance tests

### Normal pass
1. Player fixes the null check. Clicks RUN TESTS.
2. Output shows three green ✓ lines. "Monster defeated." appears.

### Partial fail
1. Player fixes only the happy-path case. Clicks RUN TESTS.
2. Output shows ✓ for passing tests, ✗ for failing ones. No "Monster defeated."

### Syntax error
1. Player writes `function getUserCity(user {` (missing paren).
2. Output shows a descriptive error. No crash. Can run again after fixing.

### Infinite loop
1. Player writes `while(true) {}`. Clicks RUN TESTS.
2. After 5 seconds: timeout message appears. Page is still responsive.
3. Player can run again immediately.
