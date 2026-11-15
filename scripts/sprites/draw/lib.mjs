// Small pixel-art toolkit used by draw-sprites.mjs to write scripts/sprites/src/*.txt.
// Everything is integer pixels, no anti-aliasing. Light always comes from the top-left.
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')

export class Canvas {
  constructor(w, h) {
    this.w = w
    this.h = h
    this.g = Array.from({ length: h }, () => Array(w).fill('.'))
  }
  get(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.g[y][x] : '.' }
  set(x, y, c) {
    x = Math.round(x); y = Math.round(y)
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y][x] = c
  }
}

export class Mask {
  constructor(w, h) { this.w = w; this.h = h; this.a = new Uint8Array(w * h) }
  static from(w, h, fn) {
    const m = new Mask(w, h)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (fn(x + 0.5, y + 0.5)) m.a[y * w + x] = 1
    return m
  }
  has(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h && this.a[y * this.w + x] === 1 }
  add(x, y) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.a[y * this.w + x] = 1; return this }
  or(o) { const m = new Mask(this.w, this.h); for (let i = 0; i < m.a.length; i++) m.a[i] = this.a[i] | o.a[i]; return m }
  minus(o) { const m = new Mask(this.w, this.h); for (let i = 0; i < m.a.length; i++) m.a[i] = this.a[i] & (o.a[i] ^ 1); return m }
  and(o) { const m = new Mask(this.w, this.h); for (let i = 0; i < m.a.length; i++) m.a[i] = this.a[i] & o.a[i]; return m }
  shift(dx, dy) { return Mask.from(this.w, this.h, (x, y) => this.has(Math.floor(x - dx), Math.floor(y - dy))) }
  bounds() {
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.has(x, y)) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
    }
    return { x0, y0, x1, y1 }
  }
  cells() { const out = []; for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.has(x, y)) out.push([x, y]); return out }
}

// Shapes. Coordinates of ellipse/poly are in "corner space" (pixel x covers x..x+1). Rect is pixel-inclusive.
export const ellipse = (w, h, cx, cy, rx, ry) => Mask.from(w, h, (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1)
export const rect = (w, h, x0, y0, x1, y1) => Mask.from(w, h, (x, y) => x > x0 && x < x1 + 1 && y > y0 && y < y1 + 1)
export const rrect = (w, h, x0, y0, x1, y1, r) => Mask.from(w, h, (x, y) => {
  if (x <= x0 || x >= x1 + 1 || y <= y0 || y >= y1 + 1) return false
  const qx = Math.max(x0 + r - x, 0, x - (x1 + 1 - r))
  const qy = Math.max(y0 + r - y, 0, y - (y1 + 1 - r))
  return qx * qx + qy * qy <= r * r
})
export function poly(w, h, pts) {
  return Mask.from(w, h, (x, y) => {
    let inside = false
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j]
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
    }
    return inside
  })
}
export function lineCells(x0, y0, x1, y1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1)
  const out = []
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  for (;;) {
    out.push([x0, y0])
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 >= dy) { err += dy; x0 += sx }
    if (e2 <= dx) { err += dx; y0 += sy }
  }
  return out
}
// Polyline stroke as a mask; t = 1 (1px) or 2 (2x2 brush).
export function stroke(w, h, pts, t = 1) {
  const m = new Mask(w, h)
  for (let i = 0; i < pts.length - 1; i++) for (const [x, y] of lineCells(...pts[i], ...pts[i + 1])) {
    m.add(x, y)
    if (t > 1) { m.add(x + 1, y); m.add(x, y + 1); m.add(x + 1, y + 1) }
  }
  return m
}

export const px = (cv, x, y, c) => cv.set(x, y, c)
export function line(cv, pts, c) {
  for (let i = 0; i < pts.length - 1; i++) for (const [x, y] of lineCells(...pts[i], ...pts[i + 1])) cv.set(x, y, c)
}
export function fill(cv, m, c) { for (const [x, y] of m.cells()) cv.set(x, y, c) }
export function fillRect(cv, x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) cv.set(x, y, c) }

// 4-step ramp shader: h (highlight rim), l (light), b (base), s (shadow). Light from the top-left.
export function shade(cv, m, R, o = {}) {
  const k = o.k ?? 3, hiT = o.hiT ?? 0.28, rimL = o.rimL ?? 2
  const bd = m.bounds(), bw = bd.x1 - bd.x0 + 1, bh = bd.y1 - bd.y0 + 1
  for (const [x, y] of m.cells()) {
    const rim = !m.has(x - 1, y) || !m.has(x, y - 1)
    const t = ((x - bd.x0) / bw + (y - bd.y0) / bh) / 2
    const lz = !m.has(x - rimL, y - 1) || !m.has(x - 1, y - rimL)
    const sz = !m.has(x + k, y + k) || !m.has(x + k + 1, y)
    let c = R.b
    if (rim && t < hiT) c = R.h
    else if (rim) c = R.l
    else if (sz) c = R.s
    else if (lz) c = R.l
    cv.set(x, y, c)
  }
  // remove isolated ramp pixels (no 8-neighbour of the same colour)
  const iso = []
  for (const [x, y] of m.cells()) {
    const c = cv.get(x, y)
    if (c === R.b) continue
    let same = false
    for (let dy = -1; dy <= 1 && !same; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && cv.get(x + dx, y + dy) === c) { same = true; break }
    if (!same) iso.push([x, y])
  }
  for (const [x, y] of iso) cv.set(x, y, R.b)
}

// 1px outline around a mask (4-neighbour), drawn over whatever is there.
export function outline(cv, m, c) {
  const out = []
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (m.has(x, y)) continue
    if (m.has(x - 1, y) || m.has(x + 1, y) || m.has(x, y - 1) || m.has(x, y + 1)) out.push([x, y])
  }
  for (const [x, y] of out) cv.set(x, y, c)
}

export function part(cv, m, R, o = {}) {
  shade(cv, m, R, o)
  outline(cv, m, R.o)
}

// Dark floor shadow: flat ellipse plus short dashes at both ends. Only paints empty pixels.
export function groundShadow(cv, cx, cy, rx, ry, c, dashes = true) {
  const m = ellipse(cv.w, cv.h, cx, cy, rx, ry)
  for (const [x, y] of m.cells()) if (cv.get(x, y) === '.') cv.set(x, y, c)
  if (dashes) {
    const y = Math.round(cy - 0.5)
    for (const [a, b] of [[cx - rx - 4, cx - rx - 3], [cx + rx + 2, cx + rx + 3]]) {
      for (let x = Math.round(a); x <= Math.round(b); x++) if (cv.get(x, y) === '.') cv.set(x, y, c)
    }
  }
}

export function lint(name, cv) {
  const warn = []
  for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) {
    if (cv.get(x, y) === '.') continue
    let n = 0
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && cv.get(x + dx, y + dy) !== '.') n++
    if (n === 0) warn.push(`(${x},${y})`)
  }
  if (warn.length) console.warn(`${name}: stray pixels ${warn.join(' ')}`)
}

export function save(name, cv, pal, title) {
  const used = new Set(cv.g.flat())
  used.delete('.')
  for (const c of used) if (!pal[c]) throw new Error(`${name}: char '${c}' has no colour`)
  if (used.size > 16) throw new Error(`${name}: ${used.size} colours`)
  lint(name, cv)
  const legend = [...used].sort().map((c) => `@ ${c} ${pal[c]}`)
  const text = [
    `# ${title} (${cv.w}x${cv.h})`,
    '# Generated by scripts/sprites/draw/draw-sprites.mjs. \'.\' = transparent; every other character is one pixel.',
    ...legend,
    '---',
    ...cv.g.map((r) => r.join('')),
    '',
  ].join('\n')
  mkdirSync(SRC, { recursive: true })
  writeFileSync(join(SRC, `${name}.txt`), text)
  console.log(`${name}: ${cv.w}x${cv.h}, ${used.size} colours`)
}

// ======================================================================
// 2.5D layer: volumetric shading from a distance field (hard-banded, no gradients).
// Light comes from the top-left and slightly from the camera side.
// ======================================================================
const LIGHT = (() => { const v = [-0.5, -0.62, 0.6]; const l = Math.hypot(...v); return v.map((c) => c / l) })()

export function flipX(m) { return Mask.from(m.w, m.h, (x, y) => m.has(m.w - 1 - Math.floor(x), Math.floor(y))) }
export function dilate(m, r = 1) {
  return Mask.from(m.w, m.h, (x, y) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (m.has(Math.floor(x) + dx, Math.floor(y) + dy)) return true
    return false
  })
}

function distField(m, R = 16) {
  const d = new Float32Array(m.w * m.h)
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (!m.has(x, y)) continue
    let best = R
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const dd = Math.hypot(dx, dy)
      if (dd < best && !m.has(x + dx, y + dy)) best = dd
    }
    d[y * m.w + x] = best
  }
  // light smoothing so normals are not jagged
  const s = new Float32Array(d.length)
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (!m.has(x, y)) continue
    let t = 0, n = 0
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy
      if (xx < 0 || yy < 0 || xx >= m.w || yy >= m.h) continue
      t += d[yy * m.w + xx] * (dx === 0 && dy === 0 ? 2 : 1); n += dx === 0 && dy === 0 ? 2 : 1
    }
    s[y * m.w + x] = t / n
  }
  return s
}

// Shade a mask as an inflated volume. P = {h,l,b,s,r?,o}. o: rad (inflation radius), flat (0..1 flattens the dome),
// hi (rim highlight on/off), tl (lightness bias).
export function volume(cv, m, P, o = {}) {
  const d = distField(m)
  let maxd = 0
  for (let i = 0; i < d.length; i++) maxd = Math.max(maxd, d[i])
  const rad = Math.max(2, Math.min(o.rad ?? 7, maxd))
  const at = (x, y) => (m.has(x, y) ? d[y * m.w + x] : 0)
  const bias = o.bias ?? 0
  const cls = new Map()
  for (const [x, y] of m.cells()) {
    let ox = -(at(x + 1, y) - at(x - 1, y)), oy = -(at(x, y + 1) - at(x, y - 1))
    const ol = Math.hypot(ox, oy)
    if (ol > 1e-4) { ox /= ol; oy /= ol } else { ox = 0; oy = 0 }
    const e = Math.max(0, Math.min(0.97, 1 - at(x, y) / rad))
    const nx = ox * e, ny = oy * e, nz = Math.sqrt(1 - e * e)
    const i = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2] + bias
    let c = i > 0.7 ? P.l : i > 0.3 ? P.b : P.s
    const dd = at(x, y)
    if (o.hi !== false && dd <= 1.5 && ox * -0.7 + oy * -0.7 > 0.5 && i > 0.5) c = P.h
    else if (P.r && dd <= 2 && ox * 0.6 + oy * 0.8 > 0.6 && c === P.s) c = P.r
    cls.set(y * m.w + x, c)
  }
  for (const [x, y] of m.cells()) cv.set(x, y, cls.get(y * m.w + x))
  tidy(cv, m, P)
}

// Remove lone ramp pixels / 1px zigzags: a ramp pixel with fewer than 2 same-coloured 8-neighbours takes the commonest neighbour.
export function tidy(cv, m, P, passes = 2) {
  const ramp = new Set([P.h, P.l, P.b, P.s, P.r].filter(Boolean))
  for (let p = 0; p < passes; p++) {
    const ch = []
    for (const [x, y] of m.cells()) {
      const c = cv.get(x, y)
      if (!ramp.has(c)) continue
      let same = 0, same4 = 0
      const cnt = {}
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const n = cv.get(x + dx, y + dy)
        if (n === c) { same++; if (!dx || !dy) same4++ }
        else if (ramp.has(n) && m.has(x + dx, y + dy)) cnt[n] = (cnt[n] || 0) + 1
      }
      if (same4 <= 1 || same <= 1) {
        const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]
        if (best) ch.push([x, y, best[0]])
      }
    }
    for (const [x, y, c] of ch) cv.set(x, y, c)
  }
}

export function solid(cv, m, P, o = {}) {
  volume(cv, m, P, o)
  outline(cv, m, P.o)
}

// Box with three visible faces: front, top (lit) and right side (shadow). (dx,dy) = depth offset towards the back-right.
export function box3d(cv, x0, y0, x1, y1, dx, dy, P, o = {}) {
  const W = cv.w, H = cv.h
  const front = rect(W, H, x0, y0, x1, y1)
  const top = poly(W, H, [[x0, y0], [x1 + 1, y0], [x1 + 1 + dx, y0 - dy], [x0 + dx, y0 - dy]])
  const side = poly(W, H, [[x1 + 1, y0], [x1 + 1 + dx, y0 - dy], [x1 + 1 + dx, y1 + 1 - dy], [x1 + 1, y1 + 1]])
  const all = front.or(top).or(side)
  fill(cv, side, P.s); fill(cv, top, P.l); fill(cv, front, P.b)
  // front: lit left edge, shadowed bottom band
  for (let y = y0; y <= y1; y++) cv.set(x0, y, P.l)
  for (let x = x0; x <= x1; x++) { cv.set(x, y0, P.l); if (o.ao !== false) cv.set(x, y1, P.s) }
  if (o.ao !== false) for (let x = x0 + 1; x <= x1; x++) if ((x + y1) % 2 === 0 && y1 - 1 >= y0) cv.set(x, y1 - 1, P.s)
  // top: bright far/left edges
  for (const [x, y] of top.cells()) if (!top.has(x, y - 1) || !top.has(x - 1, y)) cv.set(x, y, P.h)
  // side: reflected light on the far edge, darker toward the floor
  for (const [x, y] of side.cells()) {
    if (P.r && !side.has(x + 1, y) && !side.has(x + 1, y - 1)) cv.set(x, y, P.r)
    if (y >= y1 - dy - 1 && o.ao !== false) cv.set(x, y, P.s)
  }
  outline(cv, all, P.o)
  return { front, top, side, all }
}

// Elliptical contact shadow on the floor. Draw it BEFORE the body.
export function floorShadow(cv, cx, cy, rx, ry, c, o = {}) {
  const m = ellipse(cv.w, cv.h, cx, cy, rx, ry)
  for (const [x, y] of m.cells()) cv.set(x, y, c)
  if (o.dashes !== false) {
    const y = Math.round(cy - 0.5)
    for (const [a, b] of [[cx - rx - 4, cx - rx - 3], [cx + rx + 2, cx + rx + 3]]) {
      for (let x = Math.round(a); x <= Math.round(b); x++) if (cv.get(x, y) === '.') cv.set(x, y, c)
    }
  }
}

export const dots = (cv, pts, c) => { for (const [x, y] of pts) cv.set(x, y, c) }
export const gloss = (cv, x, y, w, h, c) => fillRect(cv, x, y, x + w - 1, y + h - 1, c)
