# Requirements: Monster AI

## Functional Requirements

### State machine
- WHEN a monster spawns THE SYSTEM SHALL start it in PATROL state
- WHEN a monster is in PATROL AND the player enters detection radius AND has line of sight THE SYSTEM SHALL transition to ALERT
- WHEN a monster enters ALERT THE SYSTEM SHALL pause movement for 800ms then transition to CHASE
- WHEN a monster is in CHASE AND the player hides THE SYSTEM SHALL transition to SEARCH
- WHEN a monster is in CHASE AND reaches catch radius (24px) THE SYSTEM SHALL emit `player-caught`
- WHEN a monster is in SEARCH AND 8 seconds pass without finding the player THE SYSTEM SHALL return to PATROL
- WHEN a monster is in SEARCH AND the player leaves hiding AND is visible THE SYSTEM SHALL transition to CHASE

### Per-monster patrol behaviour
- WHEN Null Ghost patrols THE SYSTEM SHALL render it at 40% opacity (fully visible only in flashlight cone)
- WHEN Off-by-One patrols THE SYSTEM SHALL stop 32px short of each waypoint before reversing
- WHEN Infinite Crawler patrols THE SYSTEM SHALL loop only between the first and last waypoint endlessly
- WHEN Deadlock monsters are placed THE SYSTEM SHALL position two monsters at a doorway with a single shared waypoint

### Detection
- WHEN the office lights are on (Act 1) THE SYSTEM SHALL detect the player by proximity only
- WHEN the lights are off (Act 2+) THE SYSTEM SHALL detect the player only if the flashlight cone intersects the monster OR distance is under 80px

### Speed (Normal mode)
- WHEN in Act 1 THE SYSTEM SHALL use patrol speed 60px/s and chase speed 90px/s
- WHEN in Act 2 THE SYSTEM SHALL use patrol speed 80px/s and chase speed 120px/s
- WHEN Easy mode is active THE SYSTEM SHALL multiply all speeds by 0.7

## Non-Functional Requirements
- WHEN the AI updates THE SYSTEM SHALL NOT use a switch statement in the update loop (state pattern required)
- WHEN a monster is defeated THE SYSTEM SHALL stop all AI activity and remove the sprite
