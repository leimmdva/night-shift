// Contact sheet of every office piece (like docs/art/monsters-preview.png): 3x, shelf layout, name under each sprite.
import { makeImage, blend, scale } from './png.mjs'
import { FONT } from './draw/office-lib.mjs'

export function piecesSheet(sprites, { zoom = 3, width = 1600, gap = 20, bg = [0x23, 0x20, 0x34] } = {}) {
  const names = Object.keys(sprites)
  const labelW = (t) => t.length * 8 - 2
  const rows = []
  let cur = [], curW = gap
  for (const n of names) {
    const s = sprites[n]
    const w = Math.max(s.w * zoom, labelW(n))
    if (cur.length && curW + w + gap > width) { rows.push(cur); cur = []; curW = gap }
    cur.push({ n, w }); curW += w + gap
  }
  if (cur.length) rows.push(cur)
  let H = gap
  const placed = []
  for (const row of rows) {
    const rh = Math.max(...row.map((r) => sprites[r.n].h * zoom))
    let x = gap
    for (const { n, w } of row) {
      const s = sprites[n]
      placed.push({ n, s, x: x + Math.floor((w - s.w * zoom) / 2), y: H + rh - s.h * zoom, lx: x + Math.floor((w - labelW(n)) / 2), ly: H + rh + 6 })
      x += w + gap
    }
    H += rh + 6 + 10 + gap
  }
  const img = makeImage(width, H, [...bg, 255])
  for (const { n, s, x, y, lx, ly } of placed) {
    blend(img, scale({ w: s.w, h: s.h, d: s.d }, zoom), x, y)
    let cx = lx
    for (const ch of n) {
      const g = FONT[ch]
      if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
        const px = cx + (i % 3) * 2 + a, py = ly + Math.floor(i / 3) * 2 + b
        img.d.set([0x9a, 0xa3, 0xb8, 255], (py * width + px) * 4)
      }
      cx += 8
    }
  }
  return img
}
