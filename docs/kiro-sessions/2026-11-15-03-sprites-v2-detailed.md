# Session 03: Monster sprites, detailed style (interrupted, no commit)

- Date: 2026-11-15
- How Kiro was run: Kiro CLI, non-interactive (one prompt, run to completion, log captured).
- Commit(s): none

## Prompt given to Kiro

````markdown
Redraw all Night Shift monster sprites. The owner did not like the first pass (commit a674312): it is too flat, too small and has too little character. Keep the same pipeline (scripts/sprites/src/*.txt -> scripts/sprites/build-sprites.mjs -> public/sprites/monsters/*.png + docs/art/monsters-preview.png) and the same file names, but replace every grid with a new, better drawing. Static images only, ONE frame per sprite, no animation.

STYLE REFERENCES (drawing style only — do not copy these characters, do not trace, do not put these files in the repo; one of them is from a commercial asset pack):
- <local reference folder>/ref-slime.png
- <local reference folder>/ref-creature.png
- <local reference folder>/ref-eyeball.png
Open and study all three before drawing. What to take from them:
- Bigger, more detailed sprites: normal monsters on a 48x48 canvas (not 32), so faces and textures have room.
- A strong 1px outline in the darkest step of the body's own hue (near-black green for a green body, near-black maroon for red), closed all around the silhouette.
- A 4-step colour ramp per material: highlight, light, base, shadow. Light from the top-left. Highlights are a few bright pixels on the top-left rim and a glossy specular spot (like the slime); the shadow is a broad band on the lower right side.
- A secondary accent colour for small highlight pixels on the rim (like the yellow pixels on the green creature).
- Surface detail with a few pixels of a darker/lighter shade: veins, cracks, spots, freckles, rivets, seams (like the veins on the eyeball and the cheek marks on the creature).
- Expressive faces: eyes with a pupil and a highlight pixel, eyebrows or eyelids that give a mood (grumpy, sad, sly). Creepy-cute, never gory.
- A short dark ground shadow under each monster (an ellipse or a dashed line, like the eyeball), drawn in the sprite at the bottom.
- Clean pixel art: no anti-aliasing, no gradients, no blur, no stray single pixels, smooth stepped curves (1-1-2-3, not 1-3-1).
- Readable on #12141C and on pure black. Up to 16 colours per sprite is fine now (raise the limit in build-sprites.mjs from 8 to 16).
- Top-down 3/4 view, facing the camera, idle pose.

THE MONSTERS (accent colour in brackets). Each must have a silhouette nobody could confuse with another monster.
1. null-ghost 48x48 (#7FE3F2 ice blue). A sheet ghost, glossy like the slime, sad droopy eyes. The idea is "a reference with nothing inside": a clean round HOLE through the middle of the body (you see the dark background through it, with a darker inner rim), smaller than in the first pass and placed in the belly, clearly below the face so it never reads as a mouth. Ragged hem.
2. off-by-one 48x48 (#E86FB0 pink). A chunky cube creature with grumpy eyebrows. Its dark ground shadow is drawn where it SHOULD stand, and the body is visibly shifted one body-pixel-block (about 4px) to the right of the shadow, so the mismatch is obvious. Two square eyes of different sizes, a row of square teeth with one extra tooth poking out of the mouth, and five stubby legs where four would fit.
3. infinite-crawler 48x48 (#F07C3A orange), plus crawler-head 24x24 and crawler-segment 24x24. A plated centipede curled into an almost closed ring, its head about to bite its own tail. Segments have a plate seam line and a highlight; legs are 2px-long hooked legs, not single dots. The head has antennae, mandibles and two glowing eyes. The segment sprite must look like an armoured plate, not a ball.
4. async-phantom 32x56 (#9C7CF2 lilac), plus phantom-shadow 40x14. A TALL, very thin hooded figure: long narrow body, arms hanging down to the knees with long fingers, a dark hood with two small glowing lilac eyes, a ring of 8 dots around the head like a loading spinner (some bright, some dim). Its lower body fades into a ragged, broken edge. It must be clearly taller and thinner than every other monster. The shadow sprite is a flat lilac silhouette of the same figure lying on the floor, with two bright eye pixels.
5. memory-leech 48x40 (#A9F07E green on a purple body), plus leech-trail 24x12. A fat, glossy, segmented leech with a round mouth full of small pale teeth (a lamprey-like ring of teeth, not a gear), three small green RAM sticks with gold pins stuck in its back, and drips of green slime. Trail tile: a glossy green slime puddle with highlight pixels.
6. twin-a and twin-b, 32x32 each (#4FA3F7 electric blue). Small round imps with sly grins and pointed ears; each has two antennae shaped like clear zig-zag lightning bolts ending in a bright tip. twin-b is the same drawing but with a visible jitter: a darker blue duplicate outline offset 2px to the right behind it (clearly visible at 1x).
7. deadlock-a and deadlock-b, 40x56 each (#9AA6BF steel grey, keyhole glow #FF5A47). A hunched armoured golem with riveted plates, cracks and scratches, a padlock-shaped chest plate with a glowing red keyhole, glowing red slit eyes under a heavy brow, and huge fists. deadlock-a holds a large padlock (at least 14x14, clear shackle) in its right fist; deadlock-b is its mirror holding a padlock in its left fist. Shade each after mirroring so the light still comes from the top-left.
8. legacy 64x64 (beige, yellow note, red cables). Keep the current idea (it was the best one): a heap of old CRT monitors, a floppy disk and a sticky note. Add more detail: scanline pixels on the screens, a crack across one screen, tangled red and grey cables at the bottom, dust/rust spots, and a grumpy face on the main screen with eyebrows.

The red file label (profile.js etc.) is drawn by the game, NOT in the sprite.

PREVIEW
- docs/art/monsters-preview.png: all sprites at 6x scale, nearest-neighbour, on #12141C, in monster order, with 24px gaps. Under each sprite draw its name with a tiny built-in pixel font.

CHECK BEFORE YOU COMMIT
- Open docs/art/monsters-preview.png and judge every sprite against the three references and the list above. Each must have: a closed dark outline, a 4-step ramp, rim highlights, a face with mood, surface detail, and a ground shadow. If any sprite looks flat or reads as something else, redraw it and run again.
- Run npm run build-sprites, npx vitest run and npm run build; all must pass.
- Follow the dev-log steering rule (append a Timeline entry to docs/KIRO_LOG.md; also correct the previous entry's commit hash to 9e9136d).
- Commit as "feat: redraw monster sprites with detailed pixel-art style". Do not push.
- Print the list of sprites and for each one a single sentence on what changed, plus anything you are still not happy with.
````

## Kiro's final summary

No final summary exists for this session.

- First attempt: failed with a Kiro server error (`ModelRegistryUnavailableError`) before any work.
- Retry: Kiro studied the three style references, wrote a shading toolkit under `scripts/sprites/draw/` and drew the first sprites (null-ghost and off-by-one, then the crawler and phantom). It was stopped part-way when the owner asked to switch to a 2.5D look. The log ends with a tool call, not a summary.
- The uncommitted toolkit and grids were reused by session 04.

## Owner feedback

Stopped by the owner during the retry: the owner asked for a 2.5D look (solid volumes from a top-down 3/4 camera) instead of the detailed flat style. Nothing from this session was accepted or rejected on its own; the work carried over into session 04.
