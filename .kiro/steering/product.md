# product.md — What Night Shift is and who it is for

## One-line pitch
A browser horror game where bugs turn into monsters — fix the code, kill the monster, survive until dawn.

## Goal
Not pure entertainment. The player learns to debug JavaScript by doing it under pressure.
By the end of a run, they can:
- Read an error log and find the affected file
- Identify a failing test and locate the root cause
- Recognise seven common bug patterns by behaviour
- Distinguish symptom from root cause
- Read a postmortem report of their own weak spots

## Player
A developer (student or junior) who already knows basic JavaScript syntax but has not yet built
the instinct to read stack traces, spot null dereferences, or reason about async flow.
The game meets them where they are: no algorithmic puzzles, no trick questions — real bugs from real code.

## Scope (firm boundaries)
### In
- Top-down 2.5D pixel-art view. Two rooms: the one-room office (`src/game/maps/office.json`, commit 853d1f8, approved, do not restyle) and a small SERVER ROOM behind the server door
- 8 monsters, all of which ship, each tied to one bug type: Null Ghost, Off-by-One, Infinite Crawler, Async Phantom, Memory Leech, Race Twins, Deadlock, Legacy
- Acts 1–3 plus the final (Legacy), then the morning epilogue. Clock labels: 23:47 / 00:30 / 02:00 / 03:33
- Monaco editor with JavaScript syntax highlighting (no autocomplete)
- Sandboxed Web Worker test runner
- Autopsy card after each kill
- Sudo hint system (3 levels, unlimited, small score penalty)
- Checkpoint on death (solved bugs stay solved, one hint gained)
- Normal and Easy difficulty modes
- Postmortem report saved to localStorage
- Morning meeting: 3 recall questions, title determined by answers
- Play time: 15–20 minutes for a full run. The first monster appears within the first 2 minutes

### Decided flow and rules (final, owner decision)
- ONE active bug at a time. When a bug is fixed, the next monster spawns.
- Race Twins come as a pair (one bug, two sprites).
- From Act 3 on, the two Deadlock golems stand at the server door permanently until `transfer.js` is fixed. Fixing it opens the server door.
- The final (Legacy) happens in the narrow, red-lit server room.
- The laptop can only be opened inside a hide spot. While it is open the world keeps running: the monster searches and its sound is audible, but it can NOT catch a hidden player.
- Last-resort cut order if the schedule slips: Memory Leech first, then Deadlock. Nothing else is cut. If a monster is cut, the base game still has to be completable.
- Approved art: monster sprites (53b32f3) and the office map (853d1f8).

### Characters
- Player: a gender-neutral junior developer in a hoodie with headphones and a flashlight, drawn in the same 2.5D pixel-art style as the monsters.
- Sudo: a friendly amber-glowing ghost of a senior developer with glasses and a coffee mug. He appears only as a portrait in the corner of the laptop screen and never walks the map.

### Sound
- Ambience and music come from CC0 sources only. Every file and its source is listed in the README.
- Short SFX (footsteps, test pass, test fail, caught, monster sounds) are synthesised in code with Web Audio. Each monster has its own sound signature.

### Out (do not add without an explicit written decision)
- Multiplayer
- 3D
- LLM calls at runtime
- TypeScript language worker in Monaco (autocomplete)
- Mobile / touch controls
- More than two rooms (office + server room)
- More than 8 monsters in the base game
- Non-CC0 audio, or audio files for short SFX

## Success criteria for submission
- A jury member with no prior context can finish the game in under 20 minutes without help
- At least 3 external playtesters complete it without assistance (target: week of 22–28 Nov)
- All tests pass, live demo reachable, video under 3 minutes
