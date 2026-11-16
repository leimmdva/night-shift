// Draws the boss portraits and derives the worried player portrait.
// Output (text grids, read by build-portraits.mjs): scripts/sprites/src/portraits/boss.txt, boss-stern.txt, player-worried.txt.
// player.txt is the owner's drawing and is never rewritten here; player-worried.txt copies it and changes only eyebrow and mouth pixels.
//
// The boss is drawn on the same 40x78 art-pixel canvas as player.png (2px margin, 74 rows of figure, head about 30 rows).
// Style: one pixel thick dark outline round every part, flat 3-tone shading (base, light on the top-left rim, shade on the
// bottom-right rim), simple bright colours. The boss faces slightly left (features sit one pixel left of the centre line).
// Run `npm run draw-portraits`, then `node scripts/sprites/build-portraits.mjs` (or `npm run build-portraits` for both).
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'portraits')
const W = 40, H = 78

const PAL = {
  o: '#1a0e1c', // outline (same as the player's)
  h: '#4f4452', H: '#75687a', i: '#342b38', g: '#b3afbd', G: '#dcd9e2', // hair, grey streaks
  s: '#f1c49c', S: '#fbdcbd', t: '#d79a76', m: '#96443f', // skin, mouth
  f: '#2f2c45', l: '#e3f4f8', L: '#a9cfe0', p: '#2a1f33', // glasses frame, lens, lens shade, pupil
  b: '#9fcbea', B: '#d2e8f6', c: '#6e9ec4', // shirt
  v: '#8b3a5e', V: '#b25882', w: '#5b2342', z: '#3b1a2c', // fleece vest, zip
  y: '#f0a52a', Y: '#b97814', // lanyard
  a: '#f6f2e9', A: '#cfc8b8', d: '#7f8fa8', // ID badge
  n: '#ff8a1f', N: '#c45a0f', q: '#4fa04a', // pumpkin pin
  r: '#45445a', R: '#5f5e78', e: '#2f2e42', // trousers
  k: '#7b4a2a', u: '#e5c35a', // belt, buckle
  j: '#8c5a38', J: '#b57d52', x: '#5c3825', // shoes
  M: '#f4efe2', K: '#cfc6b0', C: '#4a2c1e', W: '#e8e6ee', // mug, coffee, steam
  P: '#2b2f45', Q: '#8fe0f0', E: '#4fa8c0', // phone, screen
}

class Grid {
  constructor() { this.c = Array.from({ length: H }, () => Array(W).fill('.')) }
  set(x, y, ch) { if (x >= 0 && x < W && y >= 0 && y < H) this.c[y][x] = ch }
  get(x, y) { return x >= 0 && x < W && y >= 0 && y < H ? this.c[y][x] : '.' }
  rows() { return this.c.map((r) => r.join('')) }
}
// masks are Sets of "x,y"
const key = (x, y) => `${x},${y}`
const rect = (x0, y0, x1, y1) => { const s = new Set(); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) s.add(key(x, y)); return s }
const sup = (cx, cy, rx, ry, n = 2) => { // superellipse: n=2 ellipse, larger n = squarer
  const s = new Set()
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Math.abs((x + 0.5 - cx) / rx) ** n + Math.abs((y + 0.5 - cy) / ry) ** n <= 1) s.add(key(x, y))
  return s
}
const union = (...ms) => new Set(ms.flatMap((m) => [...m]))
const minus = (a, b) => new Set([...a].filter((k) => !b.has(k)))
const inter = (a, b) => new Set([...a].filter((k) => b.has(k)))
const where = (fn) => { const s = new Set(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (fn(x, y)) s.add(key(x, y)); return s }

// Fill a part: outline ring (4-neighbour dilation) in 'o', then base, light (top-left rim) and shade (bottom-right rim).
function part(g, mask, { base, light, shade, band = 1, ring = true }) {
  const has = (x, y) => mask.has(key(x, y))
  if (ring) for (const k of mask) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!has(x + dx, y + dy) && g.get(x + dx, y + dy) !== undefined) g.set(x + dx, y + dy, 'o') }
  for (const k of mask) {
    const [x, y] = k.split(',').map(Number)
    let ch = base
    if (shade && (!has(x + 1, y) || !has(x, y + 1) || (band > 1 && (!has(x + 2, y) || !has(x, y + 2))))) ch = shade
    else if (light && (!has(x - 1, y) || !has(x, y - 1))) ch = light
    g.set(x, y, ch)
  }
}
const px = (g, pts, ch) => { for (const [x, y] of pts) g.set(x, y, ch) }
const line = (g, x0, x1, y, ch) => { for (let x = x0; x <= x1; x++) g.set(x, y, ch) }
const mirror = (x) => 37 - x // glasses/brows are symmetric about x = 18.5 (the face is turned slightly left)

function drawBoss(expr) {
  const g = new Grid()
  const stern = expr === 'stern'

  // legs and trousers (hips are one shape, legs split at row 62)
  const hips = rect(11, 54, 28, 61)
  const legL = rect(11, 62, 17, 70), legR = rect(22, 62, 28, 70)
  part(g, union(hips, legL, legR), { base: 'r', light: 'R', shade: 'e', band: 2 })
  line(g, 11, 28, 54, 'k') // belt
  line(g, 11, 28, 55, 'k'); px(g, [[19, 54], [20, 54], [19, 55], [20, 55]], 'u')
  px(g, [[14, 64], [15, 65], [25, 64], [26, 65]], 'e') // knee creases
  // shoes: brown leather, toes point left
  const shoeL = union(rect(8, 71, 17, 74), rect(9, 70, 16, 70)), shoeR = union(rect(22, 71, 31, 74), rect(23, 70, 30, 70))
  part(g, shoeL, { base: 'j', light: 'J', shade: 'x' })
  part(g, shoeR, { base: 'j', light: 'J', shade: 'x' })
  line(g, 9, 16, 75, 'o'); line(g, 23, 30, 75, 'o')
  px(g, [[9, 72], [10, 72], [23, 72], [24, 72]], 'J')

  // shirt torso (visible at the neck and in the sleeves) and sleeves
  const torso = rect(9, 34, 30, 53)
  part(g, torso, { base: 'b', light: 'B', shade: 'c' })
  const sleeveL = rect(4, 36, 9, 48), sleeveR = rect(30, 36, 35, 48)
  part(g, sleeveL, { base: 'b', light: 'B', shade: 'c' })
  part(g, sleeveR, { base: 'b', light: 'B', shade: 'c' })
  line(g, 4, 9, 47, 'c'); line(g, 30, 35, 47, 'c') // cuffs

  // fleece vest: two panels with an open V at the neck, armholes cut by the sleeves
  const vest = where((x, y) => x >= 10 && x <= 29 && y >= 36 && y <= 53 && !(y <= 41 && Math.abs(x - 19.5) < (42 - y) * 0.9 - 0.5))
  part(g, vest, { base: 'v', light: 'V', shade: 'w', band: 2 })
  line(g, 19, 19, 42, 'z'); for (let y = 42; y <= 53; y++) g.set(19, y, 'z'); g.set(20, 42, 'z') // zip
  px(g, [[20, 43], [20, 44]], 'Y') // zip pull
  px(g, [[12, 50], [13, 50], [26, 50], [27, 50], [22, 46], [16, 47]], 'w') // fleece texture
  px(g, [[14, 40], [15, 41], [24, 40]], 'V')
  // shirt collar flaps over the vest
  px(g, [[15, 36], [16, 37], [16, 36], [17, 38], [17, 37], [23, 36], [22, 37], [22, 36], [21, 38], [21, 37]], 'B')
  px(g, [[16, 38], [17, 39], [22, 38], [21, 39]], 'o')

  // neck
  part(g, rect(16, 30, 23, 34), { base: 's', shade: 't' })

  // head: ears, face, hair
  part(g, union(rect(4, 20, 6, 25), rect(33, 20, 35, 25)), { base: 's', shade: 't' })
  px(g, [[5, 22], [5, 23], [34, 23], [34, 22]], 't')
  const head = sup(19.5, 17.5, 13.7, 13.7, 3)
  part(g, head, { base: 's', light: 'S', shade: 't', band: 2 })
  // first skin row for each column (a fringe swept to the left, small steps for a tidy cut), sideburns reach row 20
  const HL = { 9: 15, 10: 14, 11: 14, 12: 13, 13: 13, 14: 12, 15: 13, 16: 12, 17: 12, 18: 11, 19: 12, 20: 11, 21: 11, 22: 10, 23: 11, 24: 10, 25: 11, 26: 11, 27: 12, 28: 12, 29: 13 }
  const hair = where((x, y) => head.has(key(x, y)) && (y < (HL[x] ?? 99) || ((x <= 8 || x >= 30) && y < 21)))
  part(g, hair, { base: 'h', light: 'H', shade: 'i', ring: true })
  // combed strokes from the side part, a light patch, and a few grey streaks
  line(g, 12, 26, 5, 'H'); line(g, 14, 24, 6, 'H')
  for (const [x0, y0, n] of [[13, 7, 5], [18, 6, 6], [23, 7, 4]]) for (let i = 0; i < n; i++) g.set(x0 + Math.floor(i * 0.8), y0 + i, 'i')
  px(g, [[11, 5], [12, 6], [12, 7], [13, 8]], 'i') // the parting
  px(g, [[16, 8], [17, 9], [17, 10], [18, 11]], 'g'); px(g, [[17, 8]], 'G') // grey streak in the fringe
  px(g, [[25, 8], [26, 9], [26, 10], [26, 11]], 'g')
  px(g, [[7, 15], [7, 16], [7, 17], [7, 18], [8, 16], [8, 17], [8, 18], [8, 19]], 'g'); px(g, [[7, 15], [7, 16]], 'G')
  px(g, [[31, 15], [31, 16], [31, 17], [31, 18], [30, 16], [30, 17], [30, 18], [30, 19]], 'g'); px(g, [[31, 15], [31, 16]], 'G')

  // glasses (rectangular frames, pale lenses), eyes, brows
  for (const side of [0, 1]) {
    const x0 = side === 0 ? 10 : 21, x1 = x0 + 6
    for (let y = 19; y <= 24; y++) for (let x = x0; x <= x1; x++) g.set(x, y, x === x0 || x === x1 || y === 19 || y === 24 ? 'f' : 'l')
    px(g, [[x0 + 1, 23], [x0 + 2, 23], [x0 + 3, 23], [x0 + 4, 23], [x0 + 5, 23]], 'L')
    px(g, [side === 0 ? [11, 21] : [22, 21], side === 0 ? [11, 22] : [22, 22], side === 0 ? [12, 21] : [23, 21], side === 0 ? [12, 22] : [23, 22]], 'p') // eyes look left
    line(g, x0 + 1, x0 + 5, 20, 't') // heavy lids
    px(g, [[x0 + 4, 21]], 'l'); // lens glint
    line(g, x0 + 1, x0 + 5, 25, 't') // tired bags under the eyes
  }
  line(g, 17, 20, 20, 'f') // bridge
  line(g, 7, 9, 21, 'f'); line(g, 28, 30, 21, 'f') // temples of the glasses
  for (const side of [0, 1]) { // brows
    const f = side === 0 ? (x) => x : mirror
    if (stern) { for (const x of [10, 11, 12]) g.set(f(x), 17, 'i'); for (const x of [13, 14, 15, 16]) { g.set(f(x), 17, 'i'); g.set(f(x), 18, 'i') } }
    else { for (const x of [10, 11]) g.set(f(x), 18, 'h'); for (const x of [12, 13, 14, 15, 16]) g.set(f(x), 17, 'h') }
  }
  px(g, [[17, 26], [17, 27], [16, 27]], 't') // nose, a pixel left of centre
  px(g, [[17, 25]], 't')
  line(g, 15, 18, 14, 't'); line(g, 21, 24, 14, 't') // forehead lines
  px(g, [[12, 27], [12, 29], [26, 27], [26, 29]], 't') // smile lines
  if (stern) { line(g, 14, 21, 29, 'm'); px(g, [[14, 30], [21, 30]], 'm') } // flat mouth, corners down
  else { line(g, 16, 19, 29, 'm') }
  px(g, [[12, 28], [13, 28], [25, 28], [26, 28]], 't') // cheek shade
  line(g, 13, 26, 31, 't') // jaw shade under the chin

  // lanyard, badge, pumpkin pin
  for (let i = 0; i < 6; i++) { g.set(15 + i, 35 + i, 'y'); g.set(24 - i, 35 + i, 'y') }
  px(g, [[18, 41], [19, 41], [20, 41], [19, 42]], 'Y')
  const badge = rect(17, 43, 22, 49)
  part(g, badge, { base: 'a', shade: 'A' })
  px(g, [[18, 44], [19, 44], [18, 45], [19, 45]], 'd'); line(g, 18, 21, 47, 'A'); line(g, 18, 20, 48, 'A')
  px(g, [[19, 42]], 'o'); px(g, [[19, 41]], 'Y')
  px(g, [[24, 38], [25, 38], [26, 38], [24, 39], [25, 39], [26, 39]], 'n'); px(g, [[26, 39], [25, 40], [26, 40]], 'N'); px(g, [[25, 37]], 'q')
  px(g, [[23, 38], [27, 38], [23, 39], [27, 39], [24, 40], [27, 40], [25, 41], [26, 41], [24, 37], [26, 37]], 'o')

  // coffee mug in the left hand (steam, coffee, handle), phone in the right hand; hands are in front
  part(g, rect(3, 45, 4, 48), { base: 'K' })
  const mug = rect(5, 43, 11, 50)
  part(g, mug, { base: 'M', light: 'M', shade: 'K' })
  line(g, 6, 10, 43, 'C'); line(g, 6, 10, 44, 'C'); px(g, [[7, 44], [8, 44]], 'i')
  px(g, [[7, 40], [8, 41], [7, 42], [10, 39], [10, 41]], 'W') // steam
  line(g, 6, 10, 47, 'K') // darker band round the mug
  part(g, minus(rect(4, 49, 10, 52), new Set([key(4, 52), key(10, 52), key(4, 49)])), { base: 's', light: 'S', shade: 't' })
  px(g, [[7, 50], [8, 50], [9, 50]], 't')
  const phone = rect(28, 41, 32, 49)
  part(g, phone, { base: 'P', light: 'P', shade: 'P' })
  for (let y = 42; y <= 47; y++) for (let x = 29; x <= 31; x++) g.set(x, y, y === 47 ? 'E' : 'Q')
  px(g, [[29, 43], [30, 43], [29, 45]], 'E')
  part(g, minus(rect(29, 49, 35, 52), new Set([key(29, 52), key(35, 52), key(35, 49)])), { base: 's', light: 'S', shade: 't' })
  px(g, [[31, 50], [32, 50], [33, 50]], 't')
  return g.rows()
}

function legend(rows) {
  const used = [...new Set(rows.join('').replaceAll('.', ''))]
  return used.map((ch) => `@ ${ch} ${PAL[ch]}`)
}
const write = (name, rows, pal) => {
  const text = [...(pal ?? legend(rows)), '---', ...rows].join('\n') + '\n'
  writeFileSync(join(DIR, `${name}.txt`), text)
}

write('boss', drawBoss('neutral'))
write('boss-stern', drawBoss('stern'))

// ---- player-worried: copy the owner's grid, change only the eyebrow and mouth pixels ----
{
  const lines = readFileSync(join(DIR, 'player.txt'), 'utf8').split('\n')
  const at = lines.indexOf('---')
  const head = lines.slice(0, at), rows = lines.slice(at + 1).filter(Boolean).map((r) => r.split(''))
  const colour = (x, y) => rows[y][x]
  const brow = colour(13, 23) // the dark line above the eyes
  const skin = colour(14, 22) // forehead skin next to it
  const letterOf = (hex) => { const l = head.find((h) => h.endsWith(hex)); if (!l) throw new Error(`player.txt has no ${hex}`); return l.split(' ')[1] }
  const lipDark = letterOf('#ae4e3e') // her darker red (already in her palette)
  // eyebrows: inner ends move up one row so they slope up towards the middle ("worried"); the outer ends stay.
  for (const [x, y] of [[15, 22], [16, 22], [23, 22], [24, 22]]) rows[y][x] = brow
  for (const [x, y] of [[15, 23], [16, 23], [23, 23], [24, 23]]) rows[y][x] = skin
  // mouth: the two lip pixels stay and a darker pair opens under them, a small round "oh"
  for (const x of [19, 20]) rows[31][x] = lipDark
  writeFileSync(join(DIR, 'player-worried.txt'), [...head, '---', ...rows.map((r) => r.join(''))].join('\n') + '\n')
}
console.log('portraits drawn')
