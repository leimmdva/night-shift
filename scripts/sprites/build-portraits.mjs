// Builds the dialogue portraits: scripts/sprites/src/portraits/*.txt -> public/sprites/portraits/*.png (1 art pixel = 1 image pixel),
// and docs/art/portraits-preview.png (the portraits side by side at 8x, on the cream UI panel colour and on the night colour).
// player.txt comes from the owner's drawing (scripts/sprites/import-portrait.py); boss*.txt and player-worried.txt come from
// scripts/sprites/draw/portraits.mjs. Run `npm run build-portraits`.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { encodePng } from './png.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SRC = join(root, 'scripts/sprites/src/portraits')
const OUT = join(root, 'public/sprites/portraits')

export function parseGrid(text, name = 'grid') {
  const lines = text.split('\n')
  const legend = new Map()
  let i = 0
  for (; lines[i] !== '---'; i++) {
    const m = /^@ (\S) #([0-9a-fA-F]{6})$/.exec(lines[i])
    if (m) legend.set(m[1], [0, 2, 4].map((o) => parseInt(m[2].slice(o, o + 2), 16)))
  }
  const rows = lines.slice(i + 1).filter((l) => l.length > 0)
  const w = rows[0].length
  const px = new Uint8Array(w * rows.length * 4)
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`${name}: row ${y} has ${row.length} cells, expected ${w}`)
    for (let x = 0; x < w; x++) {
      if (row[x] === '.') continue
      const c = legend.get(row[x])
      if (!c) throw new Error(`${name}: '${row[x]}' not in legend`)
      px.set([...c, 255], (y * w + x) * 4)
    }
  })
  return { w, h: rows.length, px }
}

const names = readdirSync(SRC).filter((f) => f.endsWith('.txt')).map((f) => f.slice(0, -4)).sort()
const imgs = {}
mkdirSync(OUT, { recursive: true })
for (const n of names) {
  const g = parseGrid(readFileSync(join(SRC, `${n}.txt`), 'utf8'), n)
  imgs[n] = g
  writeFileSync(join(OUT, `${n}.png`), encodePng(g.w, g.h, g.px))
}

// preview: every portrait at 8x; top strip on cream panel, bottom strip on night
const S = 8, GAP = 16
const order = ['player', 'player-worried', 'boss', 'boss-stern'].filter((n) => imgs[n])
const cw = imgs[order[0]].w * S, ch = imgs[order[0]].h * S
const pw = GAP + order.length * (cw + GAP), ph = 2 * (ch + GAP) + GAP
const prev = new Uint8Array(pw * ph * 4)
for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) prev.set(y < ph / 2 ? [0xf0, 0xe2, 0xc4, 255] : [0x12, 0x14, 0x1c, 255], (y * pw + x) * 4)
for (let row = 0; row < 2; row++) order.forEach((n, k) => {
  const g = imgs[n], ox = GAP + k * (cw + GAP), oy = GAP + row * (ch + GAP)
  for (let y = 0; y < g.h * S; y++) for (let x = 0; x < g.w * S; x++) {
    const si = (Math.floor(y / S) * g.w + Math.floor(x / S)) * 4
    if (g.px[si + 3] === 0) continue
    prev.set(g.px.subarray(si, si + 4), ((oy + y) * pw + ox + x) * 4)
  }
})
writeFileSync(join(root, 'docs/art/portraits-preview.png'), encodePng(pw, ph, prev))
console.log(`portraits: ${names.join(', ')}`)
