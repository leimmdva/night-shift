// Builds the office: sprite PNGs, the map JSON and the three previews.
//   npm run build-office            (draws nothing; run `npm run draw-office` first if you changed a drawing)
// Outputs: public/sprites/office/*.png, src/game/maps/office.json, docs/art/office-preview{,-night,-annotated,-pieces}.png
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { encodePng, makeImage, blend, scale } from './png.mjs'
import { ROOT, loadOffice, loadMonster } from './office-assets.mjs'
import { buildLayout, reach, T, COLS, ROWS } from './office-layout.mjs'
import { renderBase, lightsOn, lightsOff, W, H } from './office-compose.mjs'
import { piecesSheet } from './pieces-sheet.mjs'
import { FONT } from './draw/office-lib.mjs'

const out = (p, data) => { mkdirSync(dirname(join(ROOT, p)), { recursive: true }); writeFileSync(join(ROOT, p), data) }
const png = (img) => encodePng(img.w, img.h, img.d)
const asImg = (s) => ({ w: s.w, h: s.h, d: s.d })

const S = loadOffice()
for (const [n, s] of Object.entries(S)) out(`public/sprites/office/${n}.png`, png(s))
out('docs/art/office-pieces.png', png(piecesSheet(S)))

const L = buildLayout(S)
const base = renderBase(L, S)

// ---------------------------------------------------------------- map JSON
const rel = (p) => ({ id: p.id, sprite: p.sprite, x: p.x, y: p.y, w: p.w, h: p.h, px: p.px, py: p.py, blocks: p.blocks })
const json = {
  grid: { cols: COLS, rows: ROWS, tile: T, widthPx: W, heightPx: H, wallRows: 2 },
  tiles: { floor: ['floor_a', 'floor_b', 'floor_worn', 'floor_stain'], wallFront: 'wall_front', wallTop: ['wall_top_h', 'wall_top_v', 'wall_corner'] },
  wall: L.wall.map(({ id, sprite, px, py }) => ({ id, sprite, px, py })),
  props: L.props.map(rel),
  decals: L.decals.map(({ id, sprite, px, py }) => ({ id, sprite, px, py })),
  hideSpots: L.hideSpots,
  playerDesk: L.playerDesk,
  serverDoor: L.serverDoor,
  entrance: L.entrance,
  monsterSpawns: L.monsterSpawns,
  walkable: L.walkable.map((r) => r.map((b) => (b ? 1 : 0)).join('')),
}
out('src/game/maps/office.json', JSON.stringify(json, null, 2) + '\n')

// ---------------------------------------------------------------- path check
const walk = L.walkable
const start = L.entrance.spawn
const seen = reach(walk, start.x, start.y)
const problems = []
for (const h of L.hideSpots) if (!seen.has(`${h.enter.x},${h.enter.y}`)) problems.push(`hide spot ${h.id}: entry tile unreachable`)
for (const m of L.monsterSpawns) if (!walk[m.y][m.x]) problems.push(`monster spawn ${m.x},${m.y} is blocked`)
for (const g of L.serverDoor.golemSlots) if (!walk[g.y][g.x]) problems.push(`golem slot ${g.x},${g.y} is blocked`)
const open = walk.flat().filter(Boolean).length
if (![...seen].length || seen.size < open) problems.push(`walkable tiles split: ${seen.size} reachable of ${open}`)
// every hide spot within 5 tiles of every walkable tile
let far = 0
for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (walk[y][x]) {
  if (!L.hideSpots.some((h) => Math.hypot(h.x - x, h.y - y) <= 5.5)) far++
}
if (far) console.log(`note: ${far} walkable tiles are more than 5.5 tiles from any hide spot`)

// ---------------------------------------------------------------- previews
const lit = lightsOn(base)
out('docs/art/office-preview.png', png(scale(lit, 2)))

// night: monsters stand in the room for scale
const mGhost = loadMonster('null-ghost')
const mCrawler = loadMonster('infinite-crawler')
const ghostAt = { x: 6 * T - 24, y: 4 * T - 40 } // spawn (7,3) area, left of centre aisle
const crawlAt = { x: 16 * T - 24, y: 7 * T - 30 }
const night = lightsOff(base, L, [
  { x: ghostAt.x + 24, y: ghostAt.y + 26, rx: 44, ry: 34, c: [127, 227, 242], strong: false },
])
const dim = (s, k) => {
  const o = { w: s.w, h: s.h, d: new Uint8Array(s.d) }
  for (let i = 0; i < o.d.length; i += 4) { o.d[i] = Math.round(o.d[i] * k * 0.8); o.d[i + 1] = Math.round(o.d[i + 1] * k * 0.9); o.d[i + 2] = Math.round(o.d[i + 2] * k + 14) }
  return o
}
blend(night, dim(asImg(mCrawler), 0.6), crawlAt.x, crawlAt.y)
blend(night, asImg(mGhost), ghostAt.x, ghostAt.y)
out('docs/art/office-preview-night.png', png(scale(night, 2)))

// annotated
const ann = scale(lit, 2)
const px = (x, y, c) => { if (x >= 0 && y >= 0 && x < ann.w && y < ann.h) ann.d.set([...c, 255], (y * ann.w + x) * 4) }
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const GREEN = hex('#A9F07E'), AMBER = hex('#E8A33D'), RED = hex('#C8402F'), INKC = [8, 6, 16], WHITE = [245, 240, 225]
const rectOut = (x0, y0, x1, y1, c, t = 2) => {
  for (let k = 0; k < t; k++) for (let x = x0; x <= x1; x++) { px(x, y0 + k, c); px(x, y1 - k, c) }
  for (let k = 0; k < t; k++) for (let y = y0; y <= y1; y++) { px(x0 + k, y, c); px(x1 - k, y, c) }
}
const text = (x, y, t, c, s = 2, shadow = true) => {
  let cx = x
  for (const ch of String(t).toLowerCase()) {
    const g = FONT[ch]
    if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) {
      const X = cx + (i % 3) * s + a, Y = y + Math.floor(i / 3) * s + b
      if (shadow) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) px(X + dx, Y + dy, INKC)
    }
    cx += 4 * s
  }
  cx = x
  for (const ch of String(t).toLowerCase()) {
    const g = FONT[ch]
    if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) px(cx + (i % 3) * s + a, y + Math.floor(i / 3) * s + b, c)
    cx += 4 * s
  }
}
const bbox = (spr) => {
  let x0 = spr.w, y0 = spr.h, x1 = -1, y1 = -1
  for (let y = 0; y < spr.h; y++) for (let x = 0; x < spr.w; x++) if (spr.d[(y * spr.w + x) * 4 + 3] > 200) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
  return { x0, y0, x1, y1 }
}
const spriteBox = (it) => { const b = bbox(S[it.sprite]); return [it.px + b.x0, it.py + b.y0, it.px + b.x1, it.py + b.y1] }
const everything = [...L.props, ...L.wall]
L.hideSpots.forEach((h, i) => {
  const it = everything.find((p) => p.id === h.prop)
  const [x0, y0, x1, y1] = spriteBox(it)
  rectOut(x0 * 2 - 3, y0 * 2 - 3, (x1 + 1) * 2 + 2, (y1 + 1) * 2 + 2, GREEN)
  // numbered badge inside the outline's top-left corner
  const bx = x0 * 2 + 1, by = y0 * 2 + 1 < 16 ? 16 : y0 * 2 + 1
  for (let y = 0; y < 18; y++) for (let x = 0; x < 16; x++) px(bx + x, by + y, y === 0 || y === 17 || x === 0 || x === 15 ? INKC : GREEN)
  text(bx + 3, by + 2, i + 1, INKC, 3, false)
})
{
  const pd = L.props.find((p) => p.id === L.playerDesk.prop)
  const [x0, y0, x1, y1] = spriteBox(pd)
  rectOut(x0 * 2 - 3, y0 * 2 - 3, (x1 + 1) * 2 + 2, (y1 + 1) * 2 + 2, AMBER, 3)
  const sd = L.serverDoor, sp = L.wall.find((w) => w.id === sd.prop)
  const [a, b, c, d] = spriteBox(sp)
  rectOut(a * 2 - 3, b * 2 - 3, (c + 1) * 2 + 2, (d + 1) * 2 + 2, RED, 3)
}
for (const m of L.monsterSpawns) {
  const cx = m.x * T * 2 + T, cy = m.y * T * 2 + T
  for (let k = -16; k <= 16; k++) for (let t = -2; t <= 2; t++) { px(cx + k, cy + k + t, RED); px(cx + k, cy - k + t, RED) }
  for (let k = -17; k <= 17; k++) for (const t of [-3, 3]) { px(cx + k, cy + k + t, INKC); px(cx + k, cy - k + t, INKC) }
  for (let k = -16; k <= 16; k++) for (let t = -2; t <= 2; t++) { px(cx + k, cy + k + t, RED); px(cx + k, cy - k + t, RED) }
}
// legend (bottom-right, over the free floor)
{
  const lw = 400, lh = 136, lx = ann.w - lw - 120, ly = 140
  for (let y = ly; y < ly + lh; y++) for (let x = lx; x < lx + lw; x++) ann.d.set([14, 12, 26, 255], (y * ann.w + x) * 4)
  rectOut(lx, ly, lx + lw - 1, ly + lh - 1, [90, 86, 120], 2)
  const row = (i, label, draw) => { draw(lx + 24, ly + 26 + i * 30); text(lx + 70, ly + 20 + i * 30, label, WHITE, 2, false) }
  row(0, 'hide spot', (x, y) => rectOut(x - 10, y - 10, x + 12, y + 10, GREEN))
  row(1, 'player desk', (x, y) => rectOut(x - 10, y - 10, x + 12, y + 10, AMBER, 3))
  row(2, 'server door', (x, y) => rectOut(x - 10, y - 10, x + 12, y + 10, RED, 3))
  row(3, 'monster spawn', (x, y) => { for (let k = -9; k <= 9; k++) for (let t = -1; t <= 1; t++) { px(x + 1 + k, y + k + t, RED); px(x + 1 + k, y - k + t, RED) } })
}
out('docs/art/office-preview-annotated.png', png(ann))

if (problems.length) { console.error('OFFICE CHECK FAILED:\n- ' + problems.join('\n- ')); process.exit(1) }
console.log(`office built: ${Object.keys(S).length} sprites, ${L.props.length} props, ${L.hideSpots.length} hide spots, ${seen.size}/${open} walkable tiles connected`)
