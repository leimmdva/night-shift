// Draws the player (gender-neutral junior developer: teal hoodie with hood, small headphones, flashlight)
// into scripts/sprites/src/player/*.txt.
// 9 frames of 32x36: down, up and side, each with idle, walk1 and walk2. The left-facing side view is the right one mirrored in game.
// Same toolkit and light direction (top-left) as the monsters: a 4-step ramp per material (h, l, b, s) and a 1px outline
// in each material's darkest shade. Run `npm run draw-player`, then `npm run build-player`.
import { Canvas, Mask, ellipse, rrect, poly, solid, floorShadow, px, fillRect, outline, lineCells } from './lib.mjs'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const W = 32, H = 36
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'player')
const PAL = {
  A: '#9BE3CF', B: '#5DB8A4', C: '#3A8C84', D: '#256263', O: '#10303A', // hoodie (muted teal)
  E: '#FFDDBF', F: '#F5BE97', G: '#D99B77', H: '#A86A55', P: '#5A3036', // skin
  I: '#9A6A50', J: '#6E4638', K: '#4A2E2E', L: '#32202A', Q: '#1A1019', // hair
  M: '#7F9CCB', N: '#4F6CA3', R: '#374C80', S: '#252F58', T: '#101732', // jeans
  U: '#FBF7EE', V: '#DAD7D3', W: '#ADAAB6', X: '#7A7A90', Y: '#2A2A3C', // sneakers
  Z: '#7D8399', z: '#555A6E', q: '#20222E', // headphones and flashlight metal (dark grey)
  a: '#FFB347', y: '#FFF1A8', // amber accent / lit lens
  k: '#1B1220', w: '#FFFFFF', g: '#07080C',
}
const HOOD = { h: 'A', l: 'B', b: 'C', s: 'D', o: 'O' }
const SKIN = { h: 'E', l: 'F', b: 'F', s: 'G', o: 'P' }
const HAIR = { h: 'I', l: 'J', b: 'K', s: 'L', o: 'Q' }
const JEANS = { h: 'M', l: 'N', b: 'R', s: 'S', o: 'T' }
const SHOE = { h: 'U', l: 'V', b: 'V', s: 'W', o: 'Y' }
const METAL = { h: 'Z', l: 'Z', b: 'z', s: 'q', o: 'q' }

const E = (cx, cy, rx, ry) => ellipse(W, H, cx, cy, rx, ry)
const R = (x0, y0, x1, y1, r = 1.5) => rrect(W, H, x0, y0, x1, y1, r)
const M = (fn) => Mask.from(W, H, fn)
const P = (cv, pts, c) => { for (const [x, y] of pts) px(cv, x, y, c) }

function ribbing(cv, x0, x1, y, dy = 0) { // hoodie cuff / hem: two rows of rib
  for (let x = x0; x <= x1; x++) { px(cv, x, y + dy, (x + y) % 2 ? 'C' : 'D'); px(cv, x, y + 1 + dy, 'D') }
}

// Band over the crown as a thin arc, 1px thick, with a darker underside pixel.
function band(cv, cx, cy, rx, ry, t0, t1, dy = 0) {
  const pts = []
  for (let t = t0; t <= t1; t += 0.02) pts.push([Math.round(cx + rx * Math.sin(t)), Math.round(cy + dy - ry * Math.cos(t))])
  const seen = new Set()
  const cells = pts.filter(([x, y]) => !seen.has(x + ',' + y) && seen.add(x + ',' + y))
  for (const [x, y] of cells) px(cv, x, y, 'Z')
  for (const [x, y] of cells) if (!seen.has(x + ',' + (y + 1))) px(cv, x, y + 1, 'z')
  for (const [x, y] of cells) if (x < cx - 2) px(cv, x, y, 'Z')
}

function cup(cv, x0, y0, w, h, accent) {
  solid(cv, R(x0, y0, x0 + w - 1, y0 + h - 1, 1.2), METAL, { rad: 2 })
  px(cv, accent[0], accent[1], 'a')
}

// ---- front (down) and back (up) ----
function frontBack(back, step) {
  const cv = new Canvas(W, H)
  floorShadow(cv, 16, 33.2, 9, 2.2, 'g', { dashes: false })
  const bob = step ? -1 : 0
  const lifted = step === 1 ? 0 : step === 2 ? 1 : -1
  const swing = (side) => (step === 0 ? 0 : (side === 0 ? (step === 1 ? 1 : -1) : (step === 1 ? -1 : 1)))

  // legs (jeans) and small sneakers
  for (const leg of [0, 1]) {
    const x0 = leg === 0 ? 11 : 17
    const up = lifted === leg ? 1 : 0
    solid(cv, R(x0, 23, x0 + 3, 30 - up, 1), JEANS, { rad: 2 })
    px(cv, x0 + 1, 27 - up, 'S'); px(cv, x0 + 2, 28 - up, 'S') // knee crease
    solid(cv, R(x0 - 1, 30 - up, x0 + 4, 32 - up, 1.3), SHOE, { rad: 2 })
    for (let x = x0; x <= x0 + 3; x++) px(cv, x, 32 - up, 'W') // sole
    if (!back) { px(cv, x0 + 1, 30 - up, 'W'); px(cv, x0 + 2, 30 - up, 'W') } // laces / tongue
  }

  // arms, behind the torso
  for (const side of [0, 1]) {
    const x0 = side === 0 ? 6 : 22
    const dy = swing(side)
    solid(cv, R(x0, 17 + bob + dy, x0 + 3, 22 + bob + dy, 1.8), HOOD, { rad: 3 })
    ribbing(cv, x0 + 1, x0 + 2, 21 + bob + dy)
    solid(cv, R(x0, 23 + bob + dy, x0 + 3, 25 + bob + dy, 1.3), SKIN, { rad: 2 })
  }

  // torso
  solid(cv, R(10, 16 + bob, 21, 23 + bob, 2.6), HOOD, { rad: 4 })
  ribbing(cv, 11, 20, 22, bob) // hem rib (rows 22-23)
  if (!back) {
    // kangaroo pocket
    for (let x = 12; x <= 19; x++) { px(cv, x, 19 + bob, 'D'); px(cv, x, 20 + bob, x < 16 ? 'B' : 'C') }
    for (let y = 20; y <= 21; y++) { px(cv, 12, y + bob, 'D'); px(cv, 19, y + bob, 'D') }
    px(cv, 12, 20 + bob, 'O'); px(cv, 19, 20 + bob, 'O') // pocket slits
    px(cv, 15, 21 + bob, 'D'); px(cv, 16, 21 + bob, 'D')
  } else {
    // shoulder seams
    P(cv, [[12, 18], [12, 19], [19, 18], [19, 19]].map(([x, y]) => [x, y + bob]), 'D')
  }

  // hood
  if (!back) {
    // collar ring resting on the shoulders, neck opening inside
    solid(cv, E(16, 17.4 + bob, 7.4, 3.0), HOOD, { rad: 2 })
    solid(cv, E(16, 16.4 + bob, 3.6, 1.6), SKIN, { rad: 1 })
    P(cv, [[13, 16], [14, 15], [17, 15], [18, 16]].map(([x, y]) => [x, y + bob]), 'G')
    px(cv, 9 + 1, 17 + bob, 'A'); px(cv, 11, 16 + bob, 'A')
    // drawstrings with aglets
    for (const [x, c] of [[13, 'A'], [19, 'B']]) { fillRect(cv, x, 18 + bob, x, 19 + bob, c); px(cv, x, 20 + bob, 'y') }
  } else {
    // hood hanging between the shoulder blades
    solid(cv, E(16, 18.4 + bob, 7.6, 3.8).or(R(11, 19 + bob, 20, 21 + bob, 3)), HOOD, { rad: 4 })
    P(cv, [[15, 18], [15, 19], [16, 20], [16, 21]].map(([x, y]) => [x, y + bob]), 'D')
    P(cv, [[12, 18], [13, 19], [12, 21], [19, 20], [18, 18]].map(([x, y]) => [x, y + bob]), 'D')
    P(cv, [[11, 19], [12, 20], [13, 17]].map(([x, y]) => [x, y + bob]), 'B')
  }

  // head
  const hy = 9.6 + bob
  if (!back) {
    solid(cv, E(16, hy, 6.7, 6.1), SKIN, { rad: 5 })
    // hair: cap, messy fringe, short side locks
    const hl = [10, 9, 8, 8, 9, 8, 7, 8, 9, 8, 9, 10] // first skin row per column x=10..21
    const hair = E(16, 8.2 + bob, 7.4, 6.4).or(R(9, 7 + bob, 10, 12 + bob, 1)).or(R(21, 7 + bob, 22, 12 + bob, 1))
      .minus(M((x, y) => { const i = Math.floor(x) - 10; return i >= 0 && i < 12 && y >= hl[i] + bob }))
    for (const [x, y] of [[11, 2], [14, 1], [15, 2], [18, 2], [20, 3], [9, 5], [22, 5]]) hair.add(x, y + bob)
    solid(cv, hair, HAIR, { rad: 3 })
    P(cv, [[12, 5], [16, 4], [19, 5], [13, 8], [17, 7]].map(([x, y]) => [x, y + bob]), 'L') // strand gaps
    P(cv, [[11, 4], [14, 3], [17, 3]].map(([x, y]) => [x, y + bob]), 'I')
    // face: tired but determined
    P(cv, [[11, 9], [12, 9], [13, 10], [18, 10], [19, 9], [20, 9]].map(([x, y]) => [x, y + bob]), 'L') // brows, inner ends low
    P(cv, [[12, 10], [13, 10]].map(([x, y]) => [x, y + bob]).filter(() => false), 'G')
    for (const ex of [12, 18]) {
      fillRect(cv, ex, 11 + bob, ex + 1, 12 + bob, 'k'); px(cv, ex, 11 + bob, 'w') // eye with highlight
      px(cv, ex, 10 + bob, 'G'); px(cv, ex + 1, 10 + bob, 'G') // heavy lids
      px(cv, ex, 13 + bob, 'G'); px(cv, ex + 1, 13 + bob, 'G') // bags under the eyes
    }
    px(cv, 16, 13 + bob, 'G'); px(cv, 15, 14 + bob, 'H'); px(cv, 16, 14 + bob, 'H') // nose shadow, flat mouth
    px(cv, 15, 12 + bob, 'E')
  } else {
    const hair = E(16, 9.4 + bob, 7.3, 6.7).or(R(9, 9 + bob, 22, 14 + bob, 2))
    for (const [x, y] of [[11, 2], [14, 1], [15, 2], [18, 2], [20, 3]]) hair.add(x, y + bob)
    solid(cv, hair, HAIR, { rad: 5 })
    P(cv, [[12, 6], [15, 5], [19, 6], [13, 10], [17, 9], [20, 11], [11, 12], [15, 13], [18, 14]].map(([x, y]) => [x, y + bob]), 'L')
    P(cv, [[11, 5], [14, 4], [17, 4], [12, 9]].map(([x, y]) => [x, y + bob]), 'I')
  }
  // headphones: thin band over the crown, small ear cups with an amber accent
  band(cv, 15.5, 9.6, 7.5, 6.9, -1.45, 1.45, bob)
  cup(cv, 7, 9 + bob, 3, 5, [8, 11 + bob])
  cup(cv, 22, 9 + bob, 3, 5, [23, 11 + bob])

  // flashlight in the right hand (screen right), lens end pointing forward and down
  const fy = swing(1)
  solid(cv, R(23, 24 + bob + fy, 25, 26 + bob + fy, 1), METAL, { rad: 1 })
  solid(cv, R(22, 26 + bob + fy, 26, 28 + bob + fy, 1), METAL, { rad: 1 })
  fillRect(cv, 24, 24 + bob + fy, 24, 25 + bob + fy, 'a') // grip ring
  fillRect(cv, 23, 29 + bob + fy, 25, 29 + bob + fy, 'y'); px(cv, 22, 29 + bob + fy, 'a'); px(cv, 26, 29 + bob + fy, 'a')
  px(cv, 23, 30 + bob + fy, 'a'); px(cv, 24, 30 + bob + fy, 'a'); px(cv, 25, 30 + bob + fy, 'a')
  // hand over the grip
  solid(cv, R(22, 25 + bob + fy, 25, 23 + bob + fy, 1.2), SKIN, { rad: 2 })
  return cv
}

// ---- side view, facing right ----
function side(step) {
  const cv = new Canvas(W, H)
  floorShadow(cv, 16, 33.2, 8.5, 2.2, 'g', { dashes: false })
  const bob = step ? -1 : 0
  const legX = (leg) => 12 + (step === 0 ? (leg === 0 ? -1 : 1) : leg === 0 ? (step === 1 ? -3 : 3) : (step === 1 ? 3 : -3))
  const lifted = step === 1 ? 1 : step === 2 ? 0 : -1
  for (const leg of [1, 0]) { // far leg first
    const x0 = legX(leg)
    const up = lifted === leg ? 1 : 0
    solid(cv, R(x0, 23, x0 + 3, 30 - up, 1), JEANS, { rad: 2 })
    px(cv, x0 + 1, 27 - up, 'S')
    solid(cv, R(x0 - 1, 30 - up, x0 + 5, 32 - up, 1.3), SHOE, { rad: 2 })
    for (let x = x0 - 1; x <= x0 + 4; x++) px(cv, x, 32 - up, 'W')
    px(cv, x0 + 4, 30 - up, 'W')
  }
  const sw = step === 0 ? 0 : step === 1 ? 3 : -3
  // far arm (opposite the legs), mostly hidden behind the torso
  solid(cv, R(13 - sw, 17 + bob, 16 - sw, 22 + bob, 1.6), HOOD, { rad: 3 })
  ribbing(cv, 14 - sw, 15 - sw, 21 + bob)
  solid(cv, R(13 - sw, 23 + bob, 16 - sw, 25 + bob, 1.3), SKIN, { rad: 2 })
  // hood bump behind the head and shoulders
  solid(cv, E(11.4, 17.4 + bob, 4.6, 3.8), HOOD, { rad: 3 })
  P(cv, [[9, 17], [10, 19], [12, 16]].map(([x, y]) => [x, y + bob]), 'D')
  // torso
  solid(cv, R(11, 16 + bob, 20, 23 + bob, 2.4), HOOD, { rad: 4 })
  ribbing(cv, 12, 19, 22, bob)
  // pocket edge and drawstring at the front
  for (let y = 19; y <= 21; y++) px(cv, 18, y + bob, 'D')
  px(cv, 17, 19 + bob, 'D'); px(cv, 19, 20 + bob, 'O')
  fillRect(cv, 19, 18 + bob, 19, 19 + bob, 'A'); px(cv, 19, 21 + bob, 'y')
  // near arm holding the flashlight forward
  const ay = step === 0 ? 0 : step === 1 ? -1 : 1
  solid(cv, R(14, 17 + bob, 17, 21 + bob + ay, 1.8), HOOD, { rad: 3 })
  solid(cv, R(15, 20 + bob + ay, 19, 22 + bob + ay, 1.4), HOOD, { rad: 2 })
  px(cv, 19, 20 + bob + ay, 'D'); px(cv, 19, 21 + bob + ay, 'D') // cuff
  solid(cv, R(20, 20 + bob + ay, 22, 22 + bob + ay, 1.1), SKIN, { rad: 1 })
  // flashlight: body held in the fist, head and lens ahead
  const fy = 21 + bob + ay
  solid(cv, R(22, fy, 26, fy + 1, 0.8), METAL, { rad: 1 })
  solid(cv, R(26, fy - 1, 28, fy + 2, 0.8), METAL, { rad: 1 })
  px(cv, 24, fy, 'a')
  fillRect(cv, 29, fy, 29, fy + 1, 'y'); px(cv, 30, fy, 'a'); px(cv, 30, fy + 1, 'a'); px(cv, 29, fy - 1, 'a'); px(cv, 29, fy + 2, 'a')
  solid(cv, R(20, fy - 1, 22, fy + 2, 1), SKIN, { rad: 1 }) // fist over the grip
  // head
  const hy = 9.6 + bob
  solid(cv, E(16.2, hy, 6.2, 6.1), SKIN, { rad: 5 })
  const hl = [8, 8, 7, 8, 8, 9, 9] // first skin row for x=16..22 (fringe over the brow)
  const hair = E(14.2, 8 + bob, 6.8, 6.2).or(E(11, 12 + bob, 3.4, 4.4))
    .minus(M((x, y) => { const i = Math.floor(x) - 16; return i >= 0 && i < 7 && y >= hl[i] + bob }))
    .minus(M((x, y) => x >= 15.5 && y >= 11 + bob)) // clear the face
    .minus(M((x, y) => x >= 12 && x < 16 && y >= 10 + bob && y < 14 + bob)) // ear
  for (const [x, y] of [[11, 2], [14, 1], [15, 2], [18, 2], [7, 13], [9, 15]]) hair.add(x, y + bob)
  solid(cv, hair, HAIR, { rad: 3 })
  P(cv, [[10, 6], [13, 4], [17, 5], [9, 11], [10, 14]].map(([x, y]) => [x, y + bob]), 'L')
  P(cv, [[12, 3], [15, 3], [8, 10]].map(([x, y]) => [x, y + bob]), 'I')
  // face: one eye, brow, nose, flat mouth
  P(cv, [[18, 9], [19, 9], [20, 10]].map(([x, y]) => [x, y + bob]), 'L')
  fillRect(cv, 19, 11 + bob, 20, 12 + bob, 'k'); px(cv, 19, 11 + bob, 'w')
  px(cv, 19, 10 + bob, 'G'); px(cv, 20, 10 + bob, 'G'); px(cv, 19, 13 + bob, 'G'); px(cv, 20, 13 + bob, 'G')
  px(cv, 22, 12 + bob, 'F'); px(cv, 22, 13 + bob, 'G'); px(cv, 21, 14 + bob, 'H'); px(cv, 20, 14 + bob, 'H')
  // headphones: one cup over the ear (clear of the eye), thin band over the crown
  for (const [x, y] of [[14, 8], [14, 7], [14, 6], [14, 5], [15, 4], [16, 3], [17, 3], [18, 3], [19, 4]]) px(cv, x, y + bob, 'Z')
  for (const [x, y] of [[15, 5], [17, 4], [18, 4]]) px(cv, x, y + bob, 'z')
  cup(cv, 13, 9 + bob, 3, 5, [14, 11 + bob])
  return cv
}

function save(name, cv) {
  const used = new Set(cv.g.flat()); used.delete('.')
  for (const c of used) if (!PAL[c]) throw new Error(`${name}: char '${c}' has no colour`)
  if (used.size > 40) throw new Error(`${name}: ${used.size} colours`)
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
  for (let s = 0; s < 3; s++) save(['down-idle', 'down-walk1', 'down-walk2'][s], frontBack(false, s))
  for (let s = 0; s < 3; s++) save(['up-idle', 'up-walk1', 'up-walk2'][s], frontBack(true, s))
  for (let s = 0; s < 3; s++) save(['side-idle', 'side-walk1', 'side-walk2'][s], side(s))
  console.log('player: 9 frames')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) player()
