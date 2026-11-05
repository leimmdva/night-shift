# Design: Web Worker Code Runner

## Flow

```
LaptopScene → runCode(playerCode, testCode)
  └─ Blob URL from inline workerSource string
  └─ new Worker(url, { type: 'classic' })
  └─ setTimeout(terminate, 5000)
  └─ worker.postMessage({ playerCode, testCode })
       └─ Worker: new Function(playerCode + testCode + 'return __testResults__')
       └─ worker.postMessage({ results, error })
  └─ clearTimeout, terminate, revokeObjectURL
  └─ resolve RunResult
```

## Inline test runner (inside Worker)
```js
const __testResults__ = []
function test(name, fn) { ... }
function expect(val) { return { toBe, toBeNull, toBeTruthy } }
```
No external imports. `__testResults__` is the return value.

## Timeout handling
- A hard `setTimeout` terminates the worker after 5000ms.
- Infinite loops (Infinite Crawler bug) trigger this path.
- The guard inside `03-infinite-crawler`'s testCode also counts calls and throws after 10 — this catches the bug in the Node.js validator where `worker_threads` has no timeout.

## Security
- Worker has no DOM, localStorage, or fetch access (standard Web Worker sandbox).
- `new Function` runs in the worker, not the main thread.
