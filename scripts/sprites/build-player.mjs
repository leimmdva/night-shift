// Builds the player sprite sheet from scripts/sprites/src/player/*.txt.
// Output: public/sprites/player/player.png (9 frames in a row: down, up, side x idle, walk1, walk2),
// docs/art/player-preview.png (8x contact sheet on the office floor colour and on the night colour).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { encodePng } from './png.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SRC = join(root, 'scripts/sprites/src/player')
const FRAMES = ['down-idle', 'down-walk1', 'down-walk2', 'up-idle', 'up-walk1', 'up-walk2', 'side-idle', 'side-walk1', 'side-walk2']

function parse(name) {
  const lines = readFileSync(join(SRC, `${name}.txt`), 'utf8').split('\n')
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
    for (let x = 0; x < w; x++) {
      if (row[x] === '.') continue
      const c = legend.get(row[x])
      if (!c) throw new Error(`${name}: '${row[x]}' not in legend`)
      px.set([...c, 255], (y * w + x) * 4)
    }
  })
  return { w, h: rows.length, px }
}

const frames = FRAMES.map(parse)
const fw = frames[0].w, fh = frames[0].h
const sheet = new Uint8Array(fw * frames.length * fh * 4)
frames.forEach((f, n) => {
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    sheet.set(f.px.subarray((y * fw + x) * 4, (y * fw + x) * 4 + 4), (y * fw * frames.length + n * fw + x) * 4)
  }
})
mkdirSync(join(root, 'public/sprites/player'), { recursive: true })
writeFileSync(join(root, 'public/sprites/player/player.png'), encodePng(fw * frames.length, fh, sheet))

// preview: each frame at 8x, top row on floor tan, bottom row on night
const S = 8, GAP = 16
const pw = GAP + frames.length * (fw * S + GAP), ph = 2 * (fh * S + GAP) + GAP
const prev = new Uint8Array(pw * ph * 4)
for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
  prev.set(y < ph / 2 ? [0xd9, 0xb8, 0x82, 255] : [0x12, 0x14, 0x1c, 255], (y * pw + x) * 4)
}
for (let row = 0; row < 2; row++) frames.forEach((f, n) => {
  const ox = GAP + n * (fw * S + GAP), oy = GAP + row * (fh * S + GAP)
  for (let y = 0; y < fh * S; y++) for (let x = 0; x < fw * S; x++) {
    const si = (Math.floor(y / S) * fw + Math.floor(x / S)) * 4
    if (f.px[si + 3] === 0) continue
    prev.set(f.px.subarray(si, si + 4), ((oy + y) * pw + ox + x) * 4)
  }
})
writeFileSync(join(root, 'docs/art/player-preview.png'), encodePng(pw, ph, prev))
console.log(`Built player sheet ${fw * frames.length}x${fh} -> public/sprites/player/player.png; preview -> docs/art/player-preview.png`)
