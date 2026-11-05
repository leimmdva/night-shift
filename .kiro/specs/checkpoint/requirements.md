# Requirements: Checkpoint System

## Functional Requirements

### On catch
- WHEN the player is caught THE SYSTEM SHALL flash the screen white for 200ms
- WHEN the player is caught THE SYSTEM SHALL freeze all monsters for 1 second
- WHEN the player is caught THE SYSTEM SHALL fade to black over 500ms
- WHEN the player is caught THE SYSTEM SHALL reset player position to the last checkpoint
- WHEN the player is caught THE SYSTEM SHALL resume monsters from their current positions (not respawn)
- WHEN the player is caught THE SYSTEM SHALL keep all previously solved bugs solved
- WHEN the player is caught THE SYSTEM SHALL give the player one hint level on the catching monster's bug (max 3)
- WHEN the player is caught THE SYSTEM SHALL have Sudo send: "You know where to find the fix."

### Checkpoint location
- WHEN no bug has been solved yet THE SYSTEM SHALL use the starting position as the checkpoint
- WHEN at least one bug is solved THE SYSTEM SHALL use the hide spot nearest to the most recently solved bug

### Persistence
- WHEN a bug is solved THE SYSTEM SHALL immediately save to localStorage key `night-shift-save`
- WHEN a death occurs THE SYSTEM SHALL immediately save the updated hint level and death count
- WHEN the morning meeting ends THE SYSTEM SHALL clear the save from localStorage
- WHEN the page reloads mid-run THE SYSTEM SHALL restore all solved bugs and hint levels from localStorage
