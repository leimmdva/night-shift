# Tasks: Postmortem Report

## Implementation tasks

- [ ] Define `PostmortemReport` interface in `src/types/PostmortemReport.ts`
- [ ] Create `src/state/postmortem.ts` — `generateReport(save, morningAnswers)`
- [ ] Write Vitest unit tests for `generateReport` — all title tiers, weak spot selection
- [ ] Create postmortem DOM overlay component in `src/ui/PostmortemOverlay.ts`
- [ ] Implement "Download as text" button (Blob + createObjectURL)
- [ ] Persist last report to localStorage key `night-shift-report`
- [ ] Wire `generateReport` into morning meeting scene (after 3rd question answered)

## Acceptance tests

- [ ] 0 correct morning answers → title "Mid"
- [ ] 1 correct → "Senior"
- [ ] 2–3 correct → "Staff"
- [ ] 2 bugs with hintLevel ≥ 2 → both listed as weak spots
- [ ] 0 bugs with hintLevel ≥ 2 → "No weak spots identified this run."
- [ ] Click "Download as text" → browser save dialog, file contains plain text report
