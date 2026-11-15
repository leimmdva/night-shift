# Requirements: Game Flow

Covers a whole run from page load to the postmortem. Product decisions are in `.kiro/steering/product.md` and are not repeated here. Details owned by other specs are linked, not restated:

- Editor and laptop UI: [editor](../editor/requirements.md)
- Test execution: [runner](../runner/requirements.md)
- Monster states and movement: [monster-ai](../monster-ai/requirements.md)
- Pack format and validation: [bug-pack-validation](../bug-pack-validation/requirements.md)
- Catch, checkpoint, save key: [checkpoint](../checkpoint/requirements.md)
- Report and title: [postmortem](../postmortem/requirements.md)

## Terms
- **Run**: one playthrough from "New Game" to the postmortem.
- **Active bug**: the one monster currently alive. There is never more than one. Race Twins count as one bug with two sprites. The Deadlock golems count as one bug with two sprites.
- **Hide spot**: an entry of `hideSpots` in `office.json`.
- **Queue**: the fixed order of bug packs 1 to 8, minus any pack cut under the cut order in `product.md`.

## Boot and title
- WHEN the page loads THE SYSTEM SHALL start `preloadMonaco()` before the title screen is interactive
- WHEN assets finish loading THE SYSTEM SHALL show the title screen with "Continue" (only if a save exists), "New Game", "Settings" and "Quit"
- WHEN the player picks "New Game" and a save exists THE SYSTEM SHALL ask for confirmation before clearing it
- WHEN the player picks "New Game" THE SYSTEM SHALL start Act 1 with the player at `office.json` `entrance.spawn`
- WHEN the player picks "Continue" THE SYSTEM SHALL restore the run as described in Save and resume
- WHEN the first user input happens THE SYSTEM SHALL start the audio context and ambience
- WHEN the player picks "Quit" THE SYSTEM SHALL return to the title screen (a browser tab cannot be closed by script)

## Acts and the queue
- WHEN a run starts THE SYSTEM SHALL build the queue in pack order: 01 Null Ghost, 02 Off-by-One, 03 Infinite Crawler, 04 Async Phantom, 05 Memory Leech, 06 Race Twins, 07 Deadlock, 08 Legacy
- WHEN a run is in progress THE SYSTEM SHALL keep at most one active bug
- WHEN the queue head has no active bug and the player is in the office THE SYSTEM SHALL spawn it
- WHEN a bug is fixed THE SYSTEM SHALL remove its monster and then spawn the next queue entry
- THE SYSTEM SHALL group the queue into acts: Act 1 (23:47) packs 01 and 02, Act 2 (00:30) packs 03, 04 and 05, Act 3 (02:00) packs 06 and 07, Final (03:33) pack 08
- WHEN an act starts THE SYSTEM SHALL show the act clock label as a title card for 3 seconds without blocking input
- WHEN a run starts THE SYSTEM SHALL spawn the first monster no later than 120 seconds after the player gains control
- WHEN a bug is fixed and the next monster is in the same act THE SYSTEM SHALL spawn it between 10 and 20 seconds after the autopsy card closes
- WHEN the last bug of an act is fixed THE SYSTEM SHALL show the next act title card before spawning the next monster
- WHEN a pack is cut (see `product.md` cut order) THE SYSTEM SHALL skip it in the queue and treat the act as complete when its remaining packs are fixed
- WHEN the first monster of a run has not spawned THE SYSTEM SHALL NOT allow the laptop to open

## Spawn rules
- WHEN a monster spawns in the office THE SYSTEM SHALL pick a point from `office.json` `monsterSpawns`
- WHEN choosing a spawn THE SYSTEM SHALL discard every spawn whose tile distance to the nearest tile of `playerDesk` is less than 6
- WHEN several spawns remain THE SYSTEM SHALL pick the one farthest from the player's current tile
- WHEN no spawn remains after the distance filter THE SYSTEM SHALL pick the spawn with the greatest distance to the desk and log a warning
- WHEN Race Twins spawn THE SYSTEM SHALL place the two sprites on two different valid spawns
- WHEN Act 3 starts THE SYSTEM SHALL place the two Deadlock golems on `serverDoor.golemSlots` and keep them there in the GUARD state until `transfer.js` is fixed
- WHEN Legacy spawns THE SYSTEM SHALL place it in the server room at that map's spawn point, not in the office

## Movement and camera
- WHEN the player presses a movement key THE SYSTEM SHALL move the player sprite and block movement on tiles where `walkable` is `0` and on props with `blocks: true`
- WHEN the player moves THE SYSTEM SHALL keep the camera centred on the player, clamped to the map bounds
- WHEN the player walks THE SYSTEM SHALL play a footstep sound at a steady cadence

## Hiding and the laptop
- WHEN the player stands on the `enter` tile of a hide spot and presses the interact key THE SYSTEM SHALL move the player into that hide spot and mark the player hidden
- WHEN the player is hidden and presses the interact key with the laptop closed and no menu open THE SYSTEM SHALL leave the hide spot and place the player on its `enter` tile
- WHEN the player is not hidden and presses the laptop key THE SYSTEM SHALL do nothing visible except a short "locked" cue sound
- WHEN the player is hidden, a monster is active, and the player presses the laptop key THE SYSTEM SHALL open the laptop for the active bug
- WHEN the laptop is open THE SYSTEM SHALL keep the world running: monsters keep updating and their sounds stay audible
- WHEN the laptop is open THE SYSTEM SHALL NOT let any monster catch the player
- WHEN the laptop is open and a monster is in SEARCH or CHASE THE SYSTEM SHALL keep the monster's state machine running as normal (it may walk to and past the hide spot)
- WHEN the player closes the laptop THE SYSTEM SHALL keep the player hidden
- WHEN the player is hidden THE SYSTEM SHALL make the monster treat the player as not visible (see monster-ai for the SEARCH transition)
- WHEN the player is hidden and a monster in SEARCH reaches the hide spot THE SYSTEM SHALL NOT catch the player
- IF the player leaves the hide spot while a monster has line of sight THEN THE SYSTEM SHALL let the normal ALERT and CHASE rules apply
- WHEN the player has an unsaved edit and the laptop closes THE SYSTEM SHALL discard it, as the editor spec defines

## Fixing a bug
- WHEN the player runs tests on the active bug's pack and all tests pass THE SYSTEM SHALL play the test-pass sound and emit `bug-solved` with the pack id and hint count
- WHEN the player runs tests and any test fails THE SYSTEM SHALL play the test-fail sound and keep the laptop open
- WHEN `bug-solved` is emitted THE SYSTEM SHALL close the laptop, dissolve the monster over 1.5 seconds, and then show the autopsy card
- WHEN a bug is solved THE SYSTEM SHALL save immediately (see checkpoint)
- WHEN the player requests a hint THE SYSTEM SHALL deliver the next of the three levels through the Sudo portrait on the laptop screen
- WHEN the Race Twins pack is fixed THE SYSTEM SHALL dissolve both twins together
- WHEN the Deadlock pack (`transfer.js`) is fixed THE SYSTEM SHALL dissolve both golems and then open the server door

## Autopsy card
- WHEN the monster has dissolved THE SYSTEM SHALL show the autopsy card with the pack's `autopsy.what`, `autopsy.impact` and `autopsy.fix`, each section under 20 words
- WHEN the autopsy card is open THE SYSTEM SHALL pause monster spawning but not other monsters' movement
- WHEN the player dismisses the autopsy card THE SYSTEM SHALL start the spawn delay for the next queue entry

## Catching, death and checkpoint
- WHEN a monster catches the player THE SYSTEM SHALL run the catch sequence defined in the checkpoint spec
- WHEN the player is caught THE SYSTEM SHALL keep the active bug and its monster alive
- WHEN the player is caught THE SYSTEM SHALL increment the death count and save

## Server room and the final
- WHEN the Deadlock pack is fixed THE SYSTEM SHALL open the server door at `serverDoor` and let the player walk through it
- WHEN the player crosses the door line for the first time THE SYSTEM SHALL fade to the server room map, put the player at its entrance and switch to red lighting
- WHEN the player is in the server room THE SYSTEM SHALL keep the rule that the laptop opens only inside a hide spot and the server room SHALL provide at least one hide spot
- WHEN Legacy is the active bug THE SYSTEM SHALL open a multi-file editor with `billing.js`, `invoice.js` and `utils.js` as tabs
- WHEN the Legacy pack is fixed THE SYSTEM SHALL show its autopsy card and then start the morning meeting
- WHEN the player is in the server room THE SYSTEM SHALL NOT allow returning to the office until Legacy is fixed
- IF the player is caught in the server room THEN THE SYSTEM SHALL reset the player to the server room entrance

## Morning meeting and postmortem
- WHEN the final autopsy card is dismissed THE SYSTEM SHALL fade to the morning meeting scene
- WHEN the morning meeting starts THE SYSTEM SHALL ask 3 recall questions drawn from `morning` entries of solved packs, one at a time, each with 3 answers
- WHEN a pack was cut THE SYSTEM SHALL NOT use its question
- WHEN the third answer is given THE SYSTEM SHALL generate and show the postmortem (see postmortem)
- WHEN the postmortem has been shown and the player leaves it THE SYSTEM SHALL clear the save and return to the title screen

## Save and resume
- WHEN a bug is solved, the player is caught, or an act changes THE SYSTEM SHALL write the run to localStorage key `night-shift-save` (shape in checkpoint)
- WHEN "Continue" is picked THE SYSTEM SHALL skip solved packs, restore hint levels and death count, and place the player at the checkpoint position
- WHEN "Continue" is picked and the queue head is unsolved THE SYSTEM SHALL respawn that monster using the spawn rules, not at its old position
- WHEN "Continue" is picked and the Deadlock pack is unsolved and Act 3 has started THE SYSTEM SHALL place the golems at the door again
- WHEN the saved data is missing a field or fails to parse THE SYSTEM SHALL ignore it, hide "Continue", and not throw
- WHEN the save records the server room as reached THE SYSTEM SHALL resume in the server room
- WHEN the laptop was open at the time of saving THE SYSTEM SHALL resume with the laptop closed and the player on the nearest hide spot's `enter` tile
