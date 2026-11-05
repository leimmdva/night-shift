# Design: Postmortem Report

## Data flow

```
MorningMeetingScene
  └─ generateReport(saveState, morningAnswers) → PostmortemReport
  └─ save to localStorage 'night-shift-report'
  └─ PostmortemOverlay.mount(report)
       └─ DOM div over Phaser canvas
       └─ Renders sections (see below)
       └─ "Download as text" button → Blob → createObjectURL → anchor.click()
```

## Report sections
1. Header: title earned, date, duration
2. Resolved incidents: ✓/✗ per bug with name and error type
3. Hint usage: bar indicator per bug (░ / █)
4. Deaths + caught by
5. Weak spots: bugs where hintLevel ≥ 2, with MDN link
6. Morning meeting: each question, player's answer, correct answer

## Title logic
```
correctAnswers = morningAnswers.filter(a => a.correct).length
title = correctAnswers === 0 ? 'Mid'
      : correctAnswers === 1 ? 'Senior'
      : 'Staff'
```

## Weak spot logic
```
weakSpots = solvedBugIds
  .filter(id => hintLevels[id] >= 2)
  .slice(0, 3)
  .map(id => ({ bugId: id, mdnLink: WEAK_SPOT_LINKS[id] }))
```
`WEAK_SPOT_LINKS` is a static map in `postmortem.ts`.
