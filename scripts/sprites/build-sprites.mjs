// Builds monster PNGs from the text-grid sources in scripts/sprites/src.
// Source format: '#' comment lines, '@ <char> #RRGGBB' legend lines, a '---' line, then one
// character per pixel ('.' is transparent). Node built-ins only.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SRC = join(root, 'scripts/sprites/src')
const OUT = join(root, 'public/sprites/monsters')
const SHEET = join(root, 'docs/art/monsters-preview.png')
const MAX_COLOURS = 16
const SCALE = 6
const GAP = 24
const SHEET_WIDTH = 1500
const BG = [0x12, 0x14, 0x1c]
const LABEL = [0x9a, 0xa3, 0xb8]
const LABEL_SCALE = 2

// Tiny 3x5 pixel font for the preview labels (a-z and '-').
const FONT = {
  a: '010101111101101', b: '110101110101110', c: '011100100100011', d: '110101101101110',
  e: '111100110100111', f: '111100110100100', g: '011100101101011', h: '101101111101101',
  i: '111010010010111', j: '001001001101010', k: '101101110101101', l: '100100100100111',
  m: '101111111101101', n: '110101101101101', o: '010101101101010', p: '110101110100100',
  q: '010101101111011', r: '110101110101101', s: '011100010001110', t: '111010010010010',
  u: '101101101101111', v: '101101101101010', w: '101101111111101', x: '101101010101101',
  y: '101101010010010', z: '111001010100111', '-': '000000111000000',
}

// Monster order for the contact sheet.
const ORDER = [
  'null-ghost', 'off-by-one', 'infinite-crawler', 'crawler-head', 'crawler-segment',
  'async-phantom', 'phantom-shadow', 'memory-leech', 'leech-trail', 'twin-a', 'twin-b',
  'deadlock-a', 'deadlock-b', 'legacy',
]

function parse(name) {
  const lines = readFileSync(join(SRC, `${name}.txt`), 'utf8').split('\n')
  const legend = new Map()
  let i = 0
  for (; i < lines.length && lines[i] !== '---'; i++) {
    const m = /^@ (\S) #([0-9a-fA-F]{6})$/.exec(lines[i])
    if (m) legend.set(m[1], [0, 2, 4].map((o) => parseInt(m[2].slice(o, o + 2), 16)))
  }
  if (i === lines.length) throw new Error(`${name}: missing '---' separator`)
  if (legend.size > MAX_COLOURS) throw new Error(`${name}: ${legend.size} colours (max ${MAX_COLOURS})`)
  const rows = lines.slice(i + 1).filter((l) => l.length > 0)
  const w = rows[0].length
  const px = new Uint8Array(w * rows.length * 4)
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`${name}: row ${y} has width ${row.length}, expected ${w}`)
    for (let x = 0; x < w; x++) {
      const ch = row[x]
      if (ch === '.') continue
      const c = legend.get(ch)
      if (!c) throw new Error(`${name}: row ${y} col ${x}: '${ch}' not in legend`)
      px.set([...c, 255], (y * w + x) * 4)
    }
  })
  return { name, w, h: rows.length, px }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}
function encodePng(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ])
}

const available = readdirSync(SRC).filter((f) => f.endsWith('.txt')).map((f) => f.slice(0, -4))
const extra = available.filter((n) => !ORDER.includes(n))
const names = [...ORDER.filter((n) => available.includes(n)), ...extra]
const sprites = names.map(parse)

mkdirSync(OUT, { recursive: true })
for (const s of sprites) writeFileSync(join(OUT, `${s.name}.png`), encodePng(s.w, s.h, s.px))

// Contact sheet: shelf layout, 6x nearest-neighbour, on the night colour, bottoms aligned per row,
// monster name under each sprite.
const LABEL_H = 5 * LABEL_SCALE
const labelW = (t) => t.length * 4 * LABEL_SCALE - LABEL_SCALE
const rows = []
{
  let cur = [], curW = GAP
  for (const s of sprites) {
    const w = Math.max(s.w * SCALE, labelW(s.name))
    if (cur.length && curW + w + GAP > SHEET_WIDTH) { rows.push(cur); cur = []; curW = GAP }
    cur.push({ s, w }); curW += w + GAP
  }
  if (cur.length) rows.push(cur)
}
const placed = []
let y = GAP
for (const row of rows) {
  const rowH = Math.max(...row.map((r) => r.s.h * SCALE))
  let x = GAP
  for (const { s, w } of row) {
    placed.push({ s, x: x + Math.floor((w - s.w * SCALE) / 2), y: y + rowH - s.h * SCALE, lx: x + Math.floor((w - labelW(s.name)) / 2), ly: y + rowH + 8 })
    x += w + GAP
  }
  y += rowH + 8 + LABEL_H + GAP
}
const sheetW = SHEET_WIDTH
const sheetH = y
const sheet = new Uint8Array(sheetW * sheetH * 4)
for (let i = 0; i < sheetW * sheetH; i++) sheet.set([...BG, 255], i * 4)
for (const { s, x: ox, y: oy, lx, ly } of placed) {
  let cx = lx
  for (const ch of s.name) {
    const g = FONT[ch]
    if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') {
      for (let a = 0; a < LABEL_SCALE; a++) for (let b = 0; b < LABEL_SCALE; b++) {
        sheet.set([...LABEL, 255], ((ly + Math.floor(i / 3) * LABEL_SCALE + b) * sheetW + cx + (i % 3) * LABEL_SCALE + a) * 4)
      }
    }
    cx += 4 * LABEL_SCALE
  }
  for (let py = 0; py < s.h * SCALE; py++) for (let pxl = 0; pxl < s.w * SCALE; pxl++) {
    const si = (Math.floor(py / SCALE) * s.w + Math.floor(pxl / SCALE)) * 4
    if (s.px[si + 3] === 0) continue
    sheet.set(s.px.subarray(si, si + 4), ((oy + py) * sheetW + ox + pxl) * 4)
  }
}
mkdirSync(dirname(SHEET), { recursive: true })
writeFileSync(SHEET, encodePng(sheetW, sheetH, sheet))
console.log(`Built ${sprites.length} sprites -> ${OUT}\nPreview -> ${SHEET}`)
