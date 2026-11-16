// Press Start 2P (OFL, public/fonts) sampled on its 8px grid into pixels, for build scripts that draw UI text.
// Same method as build-ui.mjs. Node built-ins plus opentype.js (dev dependency).
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import opentype from 'opentype.js'
import { makeImage, blend } from './png.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const font = opentype.parse(new Uint8Array(readFileSync(join(root, 'public/fonts/PressStart2P-Regular.ttf'))).buffer)
const cache = new Map()

function glyph(ch) {
  if (cache.has(ch)) return cache.get(ch)
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
  cache.set(ch, rows)
  return rows
}

export const textWidth = (s) => s.length * 8 - 1
export function drawText(dst, s, x, y, hex) {
  const c = [0, 2, 4].map((o) => parseInt(hex.replace('#', '').slice(o, o + 2), 16))
  const px = makeImage(1, 1, [...c, 255])
  ;[...s].forEach((ch, i) => glyph(ch).forEach((row, gy) => row.forEach((on, gx) => { if (on) blend(dst, px, x + i * 8 + gx, y + gy) })))
}
/** Greedy word wrap into lines of at most `maxChars` characters. */
export function wrap(text, maxChars) {
  const lines = []
  let line = ''
  for (const w of text.split(' ')) {
    if (line && (line + ' ' + w).length > maxChars) { lines.push(line); line = w } else line = line ? line + ' ' + w : w
  }
  if (line) lines.push(line)
  return lines
}
