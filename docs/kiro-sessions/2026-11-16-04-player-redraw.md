# Session 04 of 2026-11-16: Player sprite redraw (hooded junior dev)

- Date: 2026-11-16
- How Kiro was run: Kiro IDE, non-interactive session, on branch `feat/vertical-slice` (not pushed).
- Commit(s): pending (the commit "feat(sprites): redraw the player as a hooded junior dev at monster-sprite quality"; hash goes into the next entry).

## Prompt given to Kiro

````markdown
Redraw the player sprite (scripts/sprites/draw/player.mjs, scripts/sprites/src/player/, public/sprites/player/player.png, docs/art/player-preview.png). Stay on the branch feat/vertical-slice. Keep the same sheet layout, frame size and frame order so RoomScene keeps working without code changes (if a size change is truly needed, update the loader and animations in the same commit and make sure the game still runs).

Owner feedback on the first pass: the player is far below the quality of the approved monster sprites (commit 53b32f3). Problems to fix:
- There is no hood, so it reads as a kid in a T-shirt. The character must clearly wear a HOODIE: a visible hood resting on the back of the neck and shoulders (seen from the front as a collar ring, from the back as a hood shape, from the side as a bump behind the head), a front kangaroo pocket, drawstrings, cuffs.
- The headphones are huge yellow blocks that cover the face in the side view. Make them smaller ear cups connected by a thin headband over the head, dark grey with a small amber accent; in the side view only one cup shows and it must not cover the eyes.
- The shoes cover the legs. Show the legs (dark jeans or joggers), with smaller sneakers below them.
- The flashlight is a stick with no light. Hold a proper flashlight in one hand with a small bright amber lens/glow pixel cluster at its tip (the game already draws the light cone; this is just the lit lens).
- Raise the detail to the monsters' level: 4-step colour ramp per material (hoodie, skin, hair, jeans, shoes), light from the top-left with rim highlights, a 1px outline in each material's darkest shade (not pure black), a slight 2.5D top-down 3/4 feel, and an expressive face (eyes with a highlight pixel, eyebrows; a tired-but-determined junior dev at 3 a.m.). Gender-neutral look: medium-length messy hair, no makeup, no facial hair.
- Hoodie colour: muted teal or dark green, so it stands apart from the purple/blue monsters and the warm wood floor, and reads at night.
- Walk frames: real alternating leg steps and a slight arm swing, feet on one ground line, small bob; idle with a 1px breathing shift is fine.

Check: open docs/art/player-preview.png (front, back, side rows on light and dark backgrounds) and compare side by side with docs/art/monsters-preview.png; redraw until it matches their quality. Then run the game (npm run dev) and take a screenshot of the player in the office at the game's zoom into docs/art/slice/07-player.png; look at it.
Run npx vitest run, npm run build, npm run check-submission. Follow the dev-log steering rule (session file with owner feedback as above, Timeline entry). Commit as "feat(sprites): redraw the player as a hooded junior dev at monster-sprite quality". Do not push.
````

## Kiro's summary

Redrew all 9 frames (same 288 x 36 sheet, 32 x 36 frames, same order; RoomScene unchanged).

- Teal hoodie (4-step ramp plus a dark teal outline) with a collar ring in front, a hood shape in the back view, a hood bump behind the head in the side view, a kangaroo pocket with slits, drawstrings with aglets and ribbed cuffs and hem.
- Thin dark-grey headband with small ear cups and one amber pixel each; the side view shows one cup behind the eye.
- Jeans with a knee crease, small off-white sneakers with soles; legs are visible for about 5 rows.
- Flashlight in the right hand with a grey body, an amber ring and a lit lens (bright pixels plus amber glow).
- Messy medium-length chestnut hair, brows with low inner ends, heavy lids, eye highlight pixel, under-eye bags, flat mouth.
- Walk frames: the stepping leg lifts 1 px while the planted foot stays on the ground line, the body bobs up 1 px, arms swing 1 px. The idle frame has no breathing shift.
- `player.mjs` now uses a per-material character palette (about 30 colours per frame instead of 16). The 16 colour limit of the monster sprites was relaxed to 40 for the player.

Checked: `docs/art/player-preview.png` against `docs/art/monsters-preview.png` (it is closer, but the monsters are 3 to 4 times larger, so the face and flashlight stay coarse); in the game at zoom 2 (`docs/art/slice/07-player.png`, crop of the player on the carpet; no console errors). `npx vitest run` (61 tests), `npm run build` and `npm run check-submission` were run before the commit.

Not happy with: the front flashlight reads as a small grey block; the side view's hood bump looks like a raised arm at a glance; the pocket is simple at this size; the sprite is still plainer than the monsters.

## Resulting commits

pending

## Owner feedback

Owner feedback on the first pass (the reason for this redraw): the player was far below the monster sprites. It had no hood and read as a kid in a T-shirt, the headphones were huge yellow blocks, the shoes covered the legs, the flashlight had no light, and the detail level and colours did not match the monsters. Feedback on this redraw: pending.
