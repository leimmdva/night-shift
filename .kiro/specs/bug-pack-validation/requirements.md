# Requirements: Bug Pack Validation

## Functional Requirements

### Structure check
- WHEN the hook runs THE SYSTEM SHALL verify that `index.ts` exports a default object with all required fields: `id`, `order`, `monster`, `hints`, `autopsy`, `morning`, `brokenCode`, `testCode`, `solutionCode`
- WHEN `hints` has any count other than 3 THE SYSTEM SHALL fail with a descriptive error
- WHEN `morning.answers` has any count other than 3 THE SYSTEM SHALL fail with a descriptive error
- WHEN `morning.correct` is not 0, 1 or 2 THE SYSTEM SHALL fail with a descriptive error
- WHEN the pack `id` does not match the folder name THE SYSTEM SHALL fail with a descriptive error

### Test execution
- WHEN tests run against `brokenCode` THE SYSTEM SHALL assert that at least one test FAILS
- WHEN `brokenCode` passes all tests THE SYSTEM SHALL fail: "brokenCode passes all tests — the bug is not present"
- WHEN tests run against `solutionCode` THE SYSTEM SHALL assert that ALL tests PASS
- WHEN `solutionCode` fails any test THE SYSTEM SHALL fail and name the failing tests

### Output
- WHEN all checks pass THE SYSTEM SHALL print: `✓ <pack-id>  broken:N/M fail  solution:N/M pass`
- WHEN any check fails THE SYSTEM SHALL print: `✗ <pack-id>` followed by each `ERROR:` line
- WHEN validation fails THE SYSTEM SHALL exit with code 1

### Hook trigger
- WHEN any file inside `src/bugs/` is saved THE SYSTEM SHALL run `node scripts/validate-pack.js` automatically
