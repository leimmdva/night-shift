# Requirements: Web Worker Code Runner

## Functional Requirements

### Sandbox
- WHEN the player clicks Run Tests THE SYSTEM SHALL execute player code inside a new `Worker`, never on the main thread
- WHEN a run starts THE SYSTEM SHALL create a new Worker for that run (never reuse)
- WHEN a Worker is created THE SYSTEM SHALL use an inline Blob URL (no separate worker file)
- WHEN player code runs THE SYSTEM SHALL execute it via `new Function(playerCode + testCode + 'return __testResults__')`

### Timeout
- WHEN a Worker runs for more than 5000ms THE SYSTEM SHALL terminate it
- WHEN a Worker times out THE SYSTEM SHALL resolve with `{ passed: false, error: 'timeout' }`
- WHEN a Worker completes or times out THE SYSTEM SHALL revoke the Blob URL
- WHEN player code contains an infinite loop THE SYSTEM SHALL NOT freeze the page

### Results
- WHEN all tests pass THE SYSTEM SHALL set `RunResult.passed` to `true`
- WHEN any test fails THE SYSTEM SHALL set `RunResult.passed` to `false`
- WHEN tests run THE SYSTEM SHALL set `RunResult.output` to newline-joined `✓ name` / `✗ name` lines
- WHEN a syntax or runtime error occurs THE SYSTEM SHALL set `RunResult.error` with a descriptive message

## Non-Functional Requirements
- WHEN the player submits broken code THE SYSTEM SHALL respond within 5100ms in all cases
- WHEN the player fixes code and runs again THE SYSTEM SHALL accept a new run immediately
