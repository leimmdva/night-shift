# Spec: Postmortem Report

## Goal
At the end of a run, give the player a concrete, personal document —
not a score screen, but a real postmortem they could bring to a code review.

## When it appears
After the morning meeting (CTO questions), before the final title card.
The report is generated from the run's save state and the morning meeting answers.

## Report structure

```
NIGHT SHIFT — POST-INCIDENT REPORT
Date: 31 October 2026  |  Duration: 47 min  |  Title earned: Senior

RESOLVED INCIDENTS
──────────────────
✓ profile.js       Null Ghost       Null dereference (optional chaining)
✓ pagination.js    Off-by-One       Loop boundary off by one
✗ payment.js       Async Phantom    Not resolved — escaped

HINT USAGE
──────────
profile.js    ░░░  0 hints used
pagination.js ███  3 hints used (full walkthrough)
payment.js    ░░░  N/A

DEATHS: 1
CAUGHT BY: Off-by-One (pagination.js)

WEAK SPOTS
──────────
You used 3 hints on pagination.js. Review: array indexing, loop boundaries.

MORNING MEETING
───────────────
Q1: The profile service was throwing 500s. Root cause?
✓  A user with no address caused a null dereference on city.

Q2: The pagination query returned an extra row. Why?
✗  The loop ran one iteration too many — off-by-one on the upper bound.
   You answered: The sort order was wrong.

RECOMMENDED READING
───────────────────
• MDN: Optional chaining (?.)
• MDN: Array.prototype — length and index boundaries
```

## Data sources

| Field | Source |
|---|---|
| Resolved bugs | `SaveState.solvedBugIds` |
| Hint usage | `SaveState.hintLevels` |
| Deaths / caught by | `SaveState.deathCount` + last catcher |
| Morning answers | Captured during morning meeting scene |
| Title | Determined by correct morning answers (0→Mid, 1→Senior, 2→Staff) |
| Duration | `Date.now() - SaveState.startedAt` |

## Weak spot logic
- A bug where hints used ≥ 2 → listed as a weak spot
- Each weak spot links to one MDN article (pre-written in bug pack's `autopsy` or a static map)
- Maximum 3 weak spots shown

## Requirements

- [ ] `PostmortemReport` type defined in `src/types/PostmortemReport.ts`
- [ ] `generateReport(save, morningAnswers): PostmortemReport` in `src/state/postmortem.ts`
- [ ] Report rendered as an HTML overlay (not a Phaser scene — DOM for selectable text)
- [ ] "Download as text" button: saves `.txt` file via `Blob` + `URL.createObjectURL`
- [ ] Report also persisted to localStorage key `night-shift-report` (last run only)
- [ ] `generateReport` has unit tests covering all title tiers and weak spot selection

## Acceptance tests

### Title tiers
- 0 correct morning answers → title: "Mid"
- 1 correct → "Senior"
- 2–3 correct → "Staff"

### Weak spots
- 2 bugs with hintLevel ≥ 2 → both listed
- 0 bugs with hintLevel ≥ 2 → "No weak spots identified this run."

### Download
1. Click "Download as text". Browser prompts save.
2. File contains plain-text version of the report.
