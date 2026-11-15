// Builds the UI kit: text-grid sources in scripts/sprites/src/ui -> PNGs in public/sprites/ui,
// a manifest (ui.json, 9-slice margins and label colours), and docs/art/ui-preview.png.
// The preview re-assembles the layout of the owner's reference using only the pieces built here and
// the Press Start 2P font (OFL, public/fonts). Node built-ins plus opentype.js (dev dependency).
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import opentype from 'opentype.js'
import { encodePng, makeImage, blend, scale } from './png.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SRC = join(root, 'scripts/sprites/src/ui')
const OUT = join(root, 'public/sprites/ui')
const PREVIEW = join(root, 'docs/art/ui-preview.png')
const FONT = join(root, 'public/fonts/PressStart2P-Regular.ttf')
mkdirSync(OUT, { recursive: true })

// ---------- parse sources ----------
const hex = (s) => {
  const v = [0, 2, 4].map((o) => parseInt(s.slice(o, o + 2), 16))
  v.push(s.length === 8 ? parseInt(s.slice(6, 8), 16) : 255)
  return v
}
function parse(file) {
  const lines = readFileSync(join(SRC, file), 'utf8').split('\n')
  const legend = new Map()
  const meta = {}
  let i = 0
  for (; i < lines.length && lines[i] !== '---'; i++) {
    const m = /^@ (\S) #([0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?)$/.exec(lines[i])
    if (m) legend.set(m[1], hex(m[2]))
    const k = /^# meta (\w+)=(.*)$/.exec(lines[i])
    if (k) meta[k[1]] = k[2]
  }
  if (i === lines.length) throw new Error(`${file}: missing '---' separator`)
  const rows = lines.slice(i + 1).filter((l) => l.length > 0)
  const w = rows[0].length
  const img = makeImage(w, rows.length)
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`${file}: row ${y} has width ${row.length}, expected ${w}`)
    for (let x = 0; x < w; x++) {
      if (row[x] === '.') continue
      const c = legend.get(row[x])
      if (!c) throw new Error(`${file}: row ${y} col ${x}: '${row[x]}' not in legend`)
      img.d.set(c, (y * w + x) * 4)
    }
  })
  return { img, meta }
}

const pieces = {}
const manifest = {}
for (const file of readdirSync(SRC).filter((f) => f.endsWith('.txt') && !f.startsWith('_')).sort()) {
  const name = file.replace(/\.txt$/, '')
  const { img, meta } = parse(file)
  pieces[name] = img
  const entry = { w: img.w, h: img.h }
  if (meta.slice) entry.slice = meta.slice.split(',').map(Number)
  if (meta.label) entry.label = `#${meta.label.replace('#', '')}`
  if (meta.labelDy) entry.labelDy = Number(meta.labelDy)
  if (meta.padding) entry.padding = Number(meta.padding)
  if (meta.overlap) entry.overlap = Number(meta.overlap)
  manifest[name] = entry
  writeFileSync(join(OUT, `${name}.png`), encodePng(img.w, img.h, img.d))
}
writeFileSync(join(OUT, 'ui.json'), JSON.stringify(manifest, null, 1) + '\n')

// ---------- pixel font: sample Press Start 2P outlines on its 8px grid ----------
const fontBuf = readFileSync(FONT)
const font = opentype.parse(new Uint8Array(fontBuf).buffer)
const glyphCache = new Map()
function glyph(ch) {
  if (glyphCache.has(ch)) return glyphCache.get(ch)
  const polys = []
  let cur = null
  for (const c of font.getPath(ch, 0, 8, 8).commands) {
    if (c.type === 'M') { if (cur) polys.push(cur); cur = [[c.x, c.y]] } else if (c.type === 'L') cur.push([c.x, c.y])
  }
  if (cur) polys.push(cur)
  const inside = (x, y) => {
    let wind = 0
    for (const p of polys) for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length]
      if ((a[1] <= y) !== (b[1] <= y)) {
        const t = (y - a[1]) / (b[1] - a[1])
        if (a[0] + t * (b[0] - a[0]) > x) wind += b[1] > a[1] ? 1 : -1
      }
    }
    return wind !== 0
  }
  const rows = []
  for (let y = 0; y < 9; y++) { const r = []; for (let x = 0; x < 8; x++) r.push(inside(x + 0.5, y + 0.5)); rows.push(r) }
  glyphCache.set(ch, rows)
  return rows
}
const textWidth = (s) => s.length * 8 - 1
function drawText(dst, s, x, y, colour) {
  const c = [...hex(colour.replace('#', '')).slice(0, 3), 255]
  const px = makeImage(1, 1, c)
  ;[...s].forEach((ch, i) => {
    glyph(ch).forEach((row, gy) => row.forEach((on, gx) => { if (on) blend(dst, px, x + i * 8 + gx, y + gy) }))
  })
}

// ---------- drawing helpers for the preview ----------
function nine(dst, name, x, y, w, h) {
  const t = pieces[name]
  const [l, tp, r, b] = manifest[name].slice
  const map = (d, size, a, c, tsize) => {
    if (d < a) return d
    if (d >= size - c) return tsize - (size - d)
    const mid = tsize - a - c
    return a + (mid > 0 ? Math.floor(((d - a) * mid) / (size - a - c)) : 0)
  }
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) {
    const sx = map(dx, w, l, r, t.w), sy = map(dy, h, tp, b, t.h)
    const si = (sy * t.w + sx) * 4
    if (t.d[si + 3] === 0) continue
    const px = { w: 1, h: 1, d: t.d.subarray(si, si + 4) }
    blend(dst, px, x + dx, y + dy)
  }
}
const put = (dst, name, x, y) => blend(dst, pieces[name], Math.round(x), Math.round(y))
const putC = (dst, name, cx, cy) => put(dst, name, cx - pieces[name].w / 2, cy - pieces[name].h / 2)

const W = 504, H = 336
const K = W / 1536 // reference pixel -> logical pixel
const r = (v) => Math.round(v * K)
const BG = [0xee, 0xdb, 0xc2, 255]
const INK = '#2E1E26'
const img = makeImage(W, H, BG)

function button(colour, state, label, cx, cy, w, extra) {
  const name = `button-${colour}-${state}`
  const x = Math.round(cx - w / 2), y = Math.round(cy - 12)
  nine(img, name, x, y, w, 24)
  const m = manifest[name]
  const tw = textWidth(label) + (extra ?? 0)
  const tx = Math.round(cx - tw / 2) + (extra ?? 0)
  drawText(img, label, tx, y + 8 + (m.labelDy ?? 0), m.label)
  return { x, y }
}

// 1. buttons: 3 colours x 3 states
const cols = [['purple', 'PLAY', 221, 98], ['beige', 'SETTINGS', 530, 86], ['tan', 'QUIT', 800, 74]]
const rowsY = [111, 233, 354]
;['normal', 'pressed', 'disabled'].forEach((state, ri) => {
  for (const [colour, label, cx, w] of cols) button(colour, state, label, r(cx), r(rowsY[ri]), w)
})

// 2. icon buttons
const iconGrid = [
  ['gear', 'speaker', 'music', 'fullscreen'],
  ['help', 'info', 'save', 'exit'],
  ['pumpkin', 'code', 'terminal', 'folder'],
]
const iconX = [1038, 1172, 1297, 1421], iconY = [118, 248, 370]
iconGrid.forEach((row, ri) => row.forEach((n, ci) => putC(img, `iconbtn-${n}`, r(iconX[ci]), r(iconY[ri]))))

// 3. tabs: normal row, pressed row
;['normal', 'pressed'].forEach((state, i) => {
  const cy = r(i === 0 ? 491 : 596)
  const aw = 84, iw = 66
  const ax = r(78), by = cy + 10
  nine(img, `tab-active-${state}`, ax, by - 20, aw, 20)
  nine(img, `tab-inactive-${state}`, ax + aw, by - 18, iw, 18)
  drawText(img, 'INVENTORY', ax + 6, by - 20 + 7, manifest[`tab-active-${state}`].label)
  drawText(img, 'QUESTS', ax + aw + Math.round((iw - textWidth('QUESTS')) / 2), by - 18 + 7, INK)
  put(img, `tab-pointer-${state}`, ax + Math.round(aw / 2) - 4, by - 1)
})

// 4. terminal dialog
{
  const x = r(657), y = r(470), w = r(493), h = r(170)
  nine(img, 'panel', x, y, w, h)
  put(img, 'terminal-screen', x + 11, y + Math.round((h - 22) / 2) - 1)
  drawText(img, 'A new quest', x + 46, y + 15, INK)
  drawText(img, 'has appeared!', x + 46, y + 28, INK)
  put(img, 'more-arrow', x + w - 17, y + h - 15)
}

// 5. checkbox and radio
putC(img, 'checkbox-empty', r(1262), r(512)); putC(img, 'checkbox-checked', r(1262), r(585))
putC(img, 'radio-empty', r(1396), r(510)); putC(img, 'radio-selected', r(1396), r(585))

// 6. menu list
{
  const x = r(65), y = r(685), w = r(360), h = r(258)
  nine(img, 'panel', x, y, w, h)
  nine(img, 'menu-row-selected', x + 5, r(708), w - 10, 20)
  const items = ['Continue', 'New Game', 'Settings', 'Quit']
  const cy = [737, 792, 842, 891].map(r)
  items.forEach((t, i) => drawText(img, t, x + 34, cy[i] - 4, i === 0 ? '#F6ECDC' : INK))
  put(img, 'cursor', x + 18, cy[0] - 4)
}

// 7. dialog with Yes / No
{
  const x = r(480), y = r(695), w = r(513), h = r(235)
  nine(img, 'panel', x, y, w, h)
  drawText(img, 'Fix the error?', x + 16, y + 20, INK)
  const yes = button('purple', 'normal', 'Yes', r(619), r(854), 70, 8)
  put(img, 'cursor', yes.x + 9, yes.y + 8)
  button('beige', 'normal', 'No', r(859), r(854), 70)
}

// 8. progress bar, hearts, counter pill
{
  const x = r(1042), y = r(700), w = r(323)
  nine(img, 'bar-frame', x, y + 2, w, 12)
  nine(img, 'bar-fill', x + 2, y + 3, Math.round((w - 4) * 0.62), 8)
  ;[1080, 1153, 1227].forEach((cx, i) => putC(img, i < 2 ? 'heart-full' : 'heart-empty', r(cx), r(806)))
  const px = r(1047), py = r(868), pw = r(243)
  nine(img, 'pill', px, py, pw, 20)
  putC(img, 'coin', px + 14, py + 10)
  drawText(img, '123', px + 30, py + 6, INK)
}

// 9. vertical scrollbar
{
  const cx = r(1447), top = r(697)
  const up = pieces['scroll-up-normal']
  put(img, 'scroll-up-normal', cx - up.w / 2, top)
  const trackY = top + 16 - 1, trackH = r(942) - r(697) - 32 + 2
  nine(img, 'scroll-track', cx - 5, trackY, 10, trackH)
  nine(img, 'scroll-thumb', cx - 5, trackY + 12, 10, 26)
  put(img, 'scroll-down-normal', cx - up.w / 2, top + (r(942) - r(697)) - 16)
}

mkdirSync(dirname(PREVIEW), { recursive: true })
const big = scale(img, 2)
writeFileSync(PREVIEW, encodePng(big.w, big.h, big.d))
console.log(`build-ui: ${Object.keys(pieces).length} pieces -> public/sprites/ui, preview ${big.w}x${big.h}`)
