// Draws the player (gender-neutral junior developer: hoodie, headphones, flashlight) into scripts/sprites/src/player/*.txt.
// 9 frames of 32x36: down, up and side, each with idle, walk1 and walk2. The left-facing side view is the right one mirrored in game.
// Same toolkit and light direction (top-left) as the monsters. Run `npm run draw-player`, then `npm run build-player`.
import { Canvas, ellipse, rect, rrect, poly, solid, floorShadow, px, fillRect, outline, fill } from './lib.mjs'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const W = 32, H = 36
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'player')
const PAL = {
  o: '#1B1030', h: '#A9C8FF', l: '#6F9BF0', b: '#4A74D6', s: '#2E4A99',
  t: '#F2C29B', u: '#C88B67', n: '#4A3030', p: '#4B5170', e: '#2B2F4A',
  a: '#FFB347', y: '#FFF1A8', f: '#D9DCE6', k: '#14101C', g: '#07080C',
}
const HOODIE = { h: 'h', l: 'l', b: 'b', s: 's', o: 'o' }
const SKIN = { h: 't', l: 't', b: 't', s: 'u', o: 'o' }
const HAIR = { h: 'n', l: 'n', b: 'n', s: 'e', o: 'o' }
const PANTS = { h: 'p', l: 'p', b: 'p', s: 'e', o: 'o' }
const CUP = { h: 'y', l: 'a', b: 'a', s: 'e', o: 'o' }
const SHOE = { h: 'f', l: 'f', b: 'f', s: 'u', o: 'o' }

const E = (cx, cy, rx, ry) => ellipse(W, H, cx, cy, rx, ry)
const R = (x0, y0, x1, y1, r = 1.5) => rrect(W, H, x0, y0, x1, y1, r)

function flashlight(cv, x, y, dir) {
  // body: a grey tube with an amber ring, lens end lit
  if (dir === 'down') { fillRect(cv, x, y, x + 3, y + 6, 'o'); fillRect(cv, x + 1, y + 1, x + 2, y + 5, 'f'); fillRect(cv, x + 1, y + 3, x + 2, y + 3, 'a'); fillRect(cv, x + 1, y + 6, x + 2, y + 6, 'y') }
  else if (dir === 'up') { fillRect(cv, x, y, x + 3, y + 6, 'o'); fillRect(cv, x + 1, y + 1, x + 2, y + 5, 'f'); fillRect(cv, x + 1, y + 3, x + 2, y + 3, 'a') }
  else { fillRect(cv, x, y, x + 6, y + 2, 'o'); fillRect(cv, x + 1, y + 1, x + 4, y + 1, 'f'); px(cv, x + 3, y + 1, 'a'); fillRect(cv, x + 7, y, x + 7, y + 2, 'y') }
}

function frame(dir, step) {
  const cv = new Canvas(W, H)
  floorShadow(cv, 16, 33.4, 9, 2.4, 'g', { dashes: false })
  const bob = step === 0 ? 0 : 0 // body stays put; limbs move
  const lift = (leg) => (step === 1 ? (leg === 0 ? 2 : 0) : step === 2 ? (leg === 0 ? 0 : 2) : 0)

  if (dir === 'down' || dir === 'up') {
    // legs + shoes
    for (const leg of [0, 1]) {
      const x0 = leg === 0 ? 11 : 17
      const dy = lift(leg)
      solid(cv, R(x0, 23 - dy, x0 + 3, 30 - dy, 1), PANTS, { rad: 2 })
      solid(cv, R(x0 - 1, 29 - dy, x0 + 4, 32 - dy, 1.4), SHOE, { rad: 2 })
    }
    // arms behind the body edge (swing opposite to legs)
    const armDy = (side) => (step === 0 ? 0 : (side === 0 ? (step === 1 ? 1 : -1) : (step === 1 ? -1 : 1)))
    // torso
    solid(cv, R(9, 16, 22, 26, 3), HOODIE, { rad: 5 })
    // hoodie pocket (front) / hood back
    if (dir === 'down') {
      for (let x = 12; x <= 19; x++) px(cv, x, 23, 's')
      px(cv, 13, 17, 'o'); px(cv, 18, 17, 'o'); px(cv, 13, 18, 'h'); px(cv, 18, 18, 'h') // drawstrings
      px(cv, 13, 19, 'h'); px(cv, 18, 19, 'h')
    } else {
      solid(cv, E(16, 18.5, 7.5, 3.2), HOODIE, { rad: 3 }) // hood bunched at the neck
    }
    for (const side of [0, 1]) {
      const x0 = side === 0 ? 5 : 22
      const dy = armDy(side)
      solid(cv, R(x0, 17 + dy, x0 + 4, 25 + dy, 2), HOODIE, { rad: 3 })
      px(cv, side === 0 ? x0 + 1 : x0 + 3, 25 + dy, 't'); px(cv, side === 0 ? x0 + 2 : x0 + 2, 26 + dy, 't')
      fillRect(cv, x0 + 1, 25 + dy, x0 + 3, 26 + dy, 't'); outline(cv, rect(W, H, x0 + 1, 25 + dy, x0 + 3, 26 + dy), 'o')
    }
    // flashlight in the right-hand (screen right)
    flashlight(cv, 23, 24 + armDy(1), dir)
    // head
    const head = E(16, 11, 8, 7.6)
    solid(cv, head, dir === 'down' ? SKIN : HAIR, { rad: 5 })
    if (dir === 'down') {
      // hair cap + fringe
      const cap = head.minus(Mask2(y => y >= 9.5)).or(E(16, 6.2, 8, 3.6).and(head))
      solid(cv, cap.and(head), HAIR, { rad: 3 })
      for (const [x, y] of [[10, 9], [11, 9], [13, 9], [14, 9], [17, 9], [19, 9], [20, 9], [21, 9]]) px(cv, x, y, 'n')
      for (const [x, y] of [[11, 10], [14, 10], [20, 10]]) px(cv, x, y, 'n')
      // eyes
      fillRect(cv, 12, 12, 13, 14, 'k'); fillRect(cv, 18, 12, 19, 14, 'k')
      px(cv, 12, 12, 'y'); px(cv, 18, 12, 'y')
      px(cv, 15, 16, 'u'); px(cv, 16, 16, 'u')
    } else {
      for (const [x, y] of [[12, 14], [16, 15], [20, 14]]) px(cv, x, y, 'e')
    }
    // headphones: band over the top, amber cups on the ears
    for (let x = 9; x <= 22; x++) {
      const y = Math.round(4.6 + Math.pow((x - 15.5) / 6.6, 2) * 4)
      px(cv, x, y, 'o'); px(cv, x, y + 1, 'e')
    }
    solid(cv, R(5, 9, 8, 14, 1.6), CUP, { rad: 2 })
    solid(cv, R(23, 9, 26, 14, 1.6), CUP, { rad: 2 })
  } else {
    // ---- side view, facing right
    // legs: swing front/back
    const legX = (leg) => 13 + (step === 0 ? (leg === 0 ? -1 : 1) : leg === 0 ? (step === 1 ? -3 : 3) : (step === 1 ? 3 : -3))
    for (const leg of [1, 0]) { // far leg first
      const x0 = legX(leg)
      solid(cv, R(x0, 23, x0 + 3, 30, 1), PANTS, { rad: 2 })
      solid(cv, R(x0 - 1 + (leg === 0 ? 0 : 1), 29, x0 + 5, 32, 1.4), SHOE, { rad: 2 })
    }
    // far arm (behind torso)
    const swing = step === 0 ? 0 : step === 1 ? 2 : -2
    solid(cv, R(13 - swing, 17, 17 - swing, 25, 2), HOODIE, { rad: 3 })
    solid(cv, R(10, 16, 21, 26, 3), HOODIE, { rad: 5 })
    for (let x = 12; x <= 19; x++) px(cv, x, 24, 's')
    // near arm holding the flashlight forward
    const ay = step === 0 ? 0 : step === 1 ? -1 : 1
    solid(cv, R(15, 18 + ay, 20, 24 + ay, 2), HOODIE, { rad: 3 })
    fillRect(cv, 19, 23 + ay, 21, 25 + ay, 't'); outline(cv, rect(W, H, 19, 23 + ay, 21, 25 + ay), 'o')
    flashlight(cv, 20, 23 + ay, 'side')
    // head, face right
    const head = E(16, 11, 7.6, 7.6)
    solid(cv, head, SKIN, { rad: 5 })
    solid(cv, E(14.5, 7.2, 8.4, 4.8).and(head).or(E(12, 12, 6.2, 5.4).and(head).minus(E(12, 12, 6.2, 5.4).and(Mask2(y => y > 11.5)))), HAIR, { rad: 3 })
    fillRect(cv, 19, 11, 20, 13, 'k'); px(cv, 19, 11, 'y')
    px(cv, 22, 14, 'u'); px(cv, 23, 14, 'u')
    for (let x = 10; x <= 21; x++) {
      const y = Math.round(4.8 + Math.pow((x - 15.5) / 6.6, 2) * 4)
      px(cv, x, y, 'o'); px(cv, x, y + 1, 'e')
    }
    solid(cv, R(12, 9, 15, 14, 1.6), CUP, { rad: 2 })
  }
  return cv
}

function Mask2(fn) {
  return ellipse(W, H, 0, 0, 0, 0).or(rect(W, H, 0, 0, W - 1, H - 1).and(
    // build from predicate on y
    (() => { const m = rect(W, H, 0, 0, W - 1, H - 1); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!fn(y + 0.5)) m.a[y * W + x] = 0; return m })()
  ))
}

function save(name, cv) {
  const used = new Set(cv.g.flat()); used.delete('.')
  for (const c of used) if (!PAL[c]) throw new Error(`${name}: char '${c}' has no colour`)
  if (used.size > 16) throw new Error(`${name}: ${used.size} colours`)
  const text = [
    `# Player - ${name} (${W}x${H})`,
    "# Generated by scripts/sprites/draw/player.mjs. '.' = transparent; every other character is one pixel.",
    ...[...used].sort().map((c) => `@ ${c} ${PAL[c]}`),
    '---',
    ...cv.g.map((r) => r.join('')),
    '',
  ].join('\n')
  mkdirSync(OUT, { recursive: true })
  writeFileSync(join(OUT, `${name}.txt`), text)
}

export function player() {
  for (const dir of ['down', 'up', 'side']) {
    save(`${dir}-idle`, frame(dir, 0))
    save(`${dir}-walk1`, frame(dir, 1))
    save(`${dir}-walk2`, frame(dir, 2))
  }
  console.log('player: 9 frames')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) player()
