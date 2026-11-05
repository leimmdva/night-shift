# Requirements: Postmortem Report

## Functional Requirements

### Generation
- WHEN the morning meeting ends THE SYSTEM SHALL generate a postmortem report from the run's save state and the player's answers
- WHEN 0 morning questions are answered correctly THE SYSTEM SHALL assign title "Mid"
- WHEN 1 morning question is answered correctly THE SYSTEM SHALL assign title "Senior"
- WHEN 2 or more morning questions are answered correctly THE SYSTEM SHALL assign title "Staff"
- WHEN a bug had 2 or more hints used THE SYSTEM SHALL list it as a weak spot (max 3 weak spots shown)
- WHEN no bug had 2 or more hints used THE SYSTEM SHALL display "No weak spots identified this run."

### Display
- WHEN the report is shown THE SYSTEM SHALL render it as a DOM HTML overlay (not a Phaser scene) so text is selectable
- WHEN the report is shown THE SYSTEM SHALL include: resolved bugs, hint usage, deaths, weak spots, morning meeting answers with correct/wrong marks
- WHEN the player clicks "Download as text" THE SYSTEM SHALL save a `.txt` file via Blob and URL.createObjectURL

### Persistence
- WHEN a report is generated THE SYSTEM SHALL save it to localStorage key `night-shift-report`
- WHEN a new run is completed THE SYSTEM SHALL overwrite the previous report

## Non-Functional Requirements
- WHEN `generateReport` is called THE SYSTEM SHALL be a pure function with no DOM or Phaser dependencies (unit-testable)
