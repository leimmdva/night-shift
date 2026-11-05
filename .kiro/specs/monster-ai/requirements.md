# Requirements: Monster AI

## Functional Requirements

### State machine (base)
- WHEN a monster spawns THE SYSTEM SHALL start it in PATROL state
- WHEN a monster is in PATROL AND the player enters detection radius AND has line of sight THE SYSTEM SHALL transition to ALERT
- WHEN a monster enters ALERT THE SYSTEM SHALL pause movement for 800ms then transition to CHASE
- WHEN a monster is in CHASE AND the player hides THE SYSTEM SHALL transition to SEARCH
- WHEN a monster is in CHASE AND reaches catch radius (24px) THE SYSTEM SHALL emit `player-caught`
- WHEN a monster is in SEARCH AND 8 seconds pass without finding the player THE SYSTEM SHALL return to PATROL
- WHEN a monster is in SEARCH AND the player leaves hiding AND is visible THE SYSTEM SHALL transition to CHASE
- WHEN the AI updates THE SYSTEM SHALL NOT use a switch statement in the update loop (state pattern required)
- WHEN a monster is defeated THE SYSTEM SHALL stop all AI activity

### 1. Null Ghost (profile.js)
- WHEN Null Ghost is rendered THE SYSTEM SHALL set sprite alpha to 0.4
- WHEN Null Ghost's centre is inside the player's view cone THE SYSTEM SHALL set sprite alpha to 1.0
- WHEN Null Ghost's centre leaves the player's view cone THE SYSTEM SHALL restore sprite alpha to 0.4
- WHEN Null Ghost is rendered THE SYSTEM SHALL always draw the red file-label at full opacity regardless of alpha

### 2. Off-by-One (pagination.js)
- WHEN Off-by-One moves toward a waypoint THE SYSTEM SHALL overshoot the target by 32px in the direction of travel
- WHEN Off-by-One's overshoot position would intersect a wall THE SYSTEM SHALL clamp the target to the wall boundary
- WHEN Off-by-One is in CHASE state THE SYSTEM SHALL apply the same 32px overshoot past the player's position
- WHEN Off-by-One reaches its overshoot position THE SYSTEM SHALL turn toward the next waypoint

### 3. Infinite Crawler (retry.js)
- WHEN Infinite Crawler spawns THE SYSTEM SHALL walk a closed loop through ALL of its waypoints in order, forever
- WHEN Infinite Crawler is active THE SYSTEM SHALL never transition to ALERT, CHASE, or SEARCH
- WHEN Infinite Crawler's body is within 24px of the player THE SYSTEM SHALL emit `player-caught`
- WHEN Infinite Crawler is given waypoints THE SYSTEM SHALL treat them as a closed loop (last → first)

### 4. Async Phantom (payment.js)
- WHEN Async Phantom spawns THE SYSTEM SHALL create a SHADOW object and a BODY object
- WHEN Async Phantom updates THE SYSTEM SHALL run patrol and chase logic on the SHADOW
- WHEN 1500ms have elapsed since the last teleport THE SYSTEM SHALL snap the BODY to the SHADOW's current position
- WHEN the BODY teleports THE SYSTEM SHALL reset the 1500ms timer
- WHEN the BODY is within 24px of the player THE SYSTEM SHALL emit `player-caught` (shadow cannot catch)
- WHEN Async Phantom is rendered THE SYSTEM SHALL draw the shadow on a layer beneath all other monsters

### 5. Memory Leech (cache.js)
- WHEN 30 seconds pass THE SYSTEM SHALL increase Memory Leech's scale by 0.1
- WHEN Memory Leech's scale would exceed 1.5 THE SYSTEM SHALL clamp it to 1.5
- WHEN Memory Leech's scale increases THE SYSTEM SHALL increase its detection radius proportionally (base 150px × scale)
- WHEN Memory Leech moves THE SYSTEM SHALL place a permanent trail segment at the previous position
- WHEN the player stands on a trail segment THE SYSTEM SHALL multiply player movement speed by 0.7
- WHEN the Memory Leech bug pack is solved THE SYSTEM SHALL remove all trail segments

### 6. Race Twins (inventory.js)
- WHEN either Race Twin detects the player THE SYSTEM SHALL transition BOTH twins to ALERT on the same frame
- WHEN Race Twins are in CHASE state THE SYSTEM SHALL target Twin A to a point 40px to the left of the player and Twin B to 40px to the right
- WHEN Race Twins are spawned THE SYSTEM SHALL offset Twin B to the midpoint of the patrol loop (180° apart from Twin A)

### 7. Deadlock (transfer.js)
- WHEN Deadlock monsters spawn THE SYSTEM SHALL place them at the server room door and enter GUARD state
- WHEN Deadlock is in GUARD state THE SYSTEM SHALL never move and never chase
- WHEN the player is within 120px of a Deadlock monster THE SYSTEM SHALL rotate that monster to face the player
- WHEN the Deadlock monsters are in GUARD state THE SYSTEM SHALL keep the door collider closed
- WHEN the transfer.js bug pack is solved THE SYSTEM SHALL remove both Deadlock monsters and open the door

### 8. Legacy (billing.js / invoice.js / utils.js)
- WHEN Legacy patrols AND at least one other monster is active THE SYSTEM SHALL copy the velocity vector of the nearest active monster
- WHEN Legacy patrols AND no other monster is active THE SYSTEM SHALL walk its own waypoint loop normally

### Speed (Normal mode)
- WHEN in Act 1 THE SYSTEM SHALL use patrol speed 60px/s and chase speed 90px/s
- WHEN in Act 2 THE SYSTEM SHALL use patrol speed 80px/s and chase speed 120px/s
- WHEN Easy mode is active THE SYSTEM SHALL multiply all speeds by 0.7
