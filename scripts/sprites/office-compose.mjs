// Composes the office from tiles and props, then applies the lighting passes. Everything stays on the 1x pixel grid;
// previews are scaled by whole numbers only. Light is drawn as hard pixel bands, never gradients.
import { makeImage, blend, scale } from './png.mjs'
import { T, COLS, ROWS } from './office-layout.mjs'
import { EMISSIVE } from './draw/office-lib.mjs'

export const W = COLS * T
export const H = ROWS * T

const asImg = (s) => ({ w: s.w, h: s.h, d: s.d })
const flip = (s) => {
  const o = { w: s.w, h: s.h, d: new Uint8Array(s.d.length) }
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) o.d.set(s.d.subarray((y * s.w + x) * 4, (y * s.w + x) * 4 + 4), (y * s.w + (s.w - 1 - x)) * 4)
  return o
}
const hash = (x, y) => { let h = Math.imul(x * 73856093 ^ y * 19349663, 2654435761); h ^= h >>> 15; return (h >>> 0) / 4294967296 }

const shade = (img, x0, y0, w, h, c) => {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    if (x < 0 || y < 0 || x >= img.w || y >= img.h) continue
    const i = (y * img.w + x) * 4, a = c[3] / 255
    for (let k = 0; k < 3; k++) img.d[i + k] = Math.round(img.d[i + k] * (1 - a) + c[k] * a)
  }
}
export const WALL_T = 16

export function renderBase(L, S) {
  const img = makeImage(W, H, [0, 0, 0, 255])
  // floor: warm wood planks, a few darker and stained boards
  for (let ty = 3; ty < ROWS; ty++) for (let tx = 0; tx < COLS; tx++) {
    const r = hash(tx, ty)
    let n = (tx + ty) % 2 === 0 ? 'floor_a' : 'floor_b'
    if (r < 0.14) n = 'floor_worn'
    else if (r > 0.95) n = 'floor_stain'
    blend(img, asImg(S[n]), tx * T, ty * T)
  }
  // back wall (3 tiles tall)
  for (let tx = 0; tx < COLS; tx++) blend(img, asImg(S.wall_front), tx * T, 0)
  // soft shadows the walls cast onto the floor (light from the top-left): below the back wall, right of the left wall
  const SHW = [42, 22, 12]
  shade(img, WALL_T, 96, W - 2 * WALL_T, 5, [...SHW, 120]); shade(img, WALL_T, 101, W - 2 * WALL_T, 3, [...SHW, 64])
  shade(img, WALL_T, 104, W - 2 * WALL_T, 2, [...SHW, 30])
  shade(img, WALL_T, 96, 5, H - 96 - WALL_T, [...SHW, 100]); shade(img, WALL_T + 5, 96, 3, H - 96 - WALL_T, [...SHW, 50])
  // wall-mounted pieces
  for (const w of L.wall) blend(img, asImg(S[w.sprite]), w.px, w.py)
  // floor decals (rugs, wrappers, doormat)
  for (const d of L.decals) blend(img, asImg(S[d.sprite]), d.px, d.py)
  // props sorted by their floor line
  const sorted = [...L.props].sort((a, b) => (a.y + a.h) - (b.y + b.h) || a.x - b.x)
  for (const p of sorted) blend(img, asImg(S[p.sprite]), p.px, p.py)
  // thick walls: left and right sides, bottom (with the entrance gap), then corners
  for (let y = 0; y < H; y += T) {
    blend(img, asImg(S.wall_top_v), 0, y)
    blend(img, flip(S.wall_top_v), W - WALL_T, y)
  }
  for (let tx = 0; tx < COLS; tx++) if (tx < 1 || tx > 2) blend(img, asImg(S.wall_top_h), tx * T, H - WALL_T)
  for (const [x, y] of [[0, 0], [W - WALL_T, 0], [0, H - WALL_T], [W - WALL_T, H - WALL_T]]) blend(img, asImg(S.wall_corner), x, y)
  const ent = L.props.find((p) => p.id === 'entrance-door')
  blend(img, asImg(S[ent.sprite]), ent.px, ent.py)
  // cobwebs over everything in the top corners
  blend(img, asImg(S.cobweb_corner), WALL_T, 8)
  blend(img, flip(S.cobweb_corner), W - WALL_T - S.cobweb_corner.w, 8)
  return img
}

// ------------------------------------------------------------------ lights
const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v))
const emissiveKey = (r, g, b) => (r << 16) | (g << 8) | b
const EMIT = new Set([...EMISSIVE].map((h) => parseInt(h.slice(1, 7), 16)))

// Lit (Act 1): warm tint and banded pools under the ceiling lights.
export function lightsOn(base) {
  const img = { w: base.w, h: base.h, d: new Uint8Array(base.d) }
  const lamps = []
  for (const x of [112, 288, 464, 592]) for (const y of [138, 322]) lamps.push([x, y])
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4
    let r = img.d[i], g = img.d[i + 1], b = img.d[i + 2]
    r *= 1.04; g *= 0.985; b *= 0.9
    let band = 0
    for (const [lx, ly] of lamps) {
      const d = Math.hypot((x - lx) / 92, (y - ly) / 58)
      band = Math.max(band, d < 0.45 ? 3 : d < 0.75 ? 2 : d < 1 ? 1 : 0)
    }
    const k = [0, 0.04, 0.08, 0.12][band]
    r += (255 - r) * k; g += (238 - g) * k; b += (200 - b) * k
    img.d[i] = clamp(r); img.d[i + 1] = clamp(g); img.d[i + 2] = clamp(b)
  }
  return img
}

// Dark (Act 2): everything goes blue-black except glowing colours; then hard-banded pools of coloured light.
export function lightsOff(base, L, extraLights = []) {
  const lit = base
  const img = { w: W, h: H, d: new Uint8Array(base.d) }
  const night = new Uint8Array(base.d.length)
  for (let i = 0; i < base.d.length; i += 4) {
    const r = base.d[i], g = base.d[i + 1], b = base.d[i + 2]
    const emit = EMIT.has(emissiveKey(r, g, b))
    night[i] = emit ? r : clamp(r * 0.2 + 3)
    night[i + 1] = emit ? g : clamp(g * 0.24 + 7)
    night[i + 2] = emit ? b : clamp(b * 0.42 + 24)
    night[i + 3] = 255
  }
  img.d.set(night)
  const emissive = (i) => EMIT.has(emissiveKey(lit.d[i], lit.d[i + 1], lit.d[i + 2]))
  const BANDS = [0.62, 0.4, 0.2]
  const pool = (cx, cy, rx, ry, c, strong = 1) => {
    const x0 = Math.max(0, Math.floor(cx - rx)), x1 = Math.min(W - 1, Math.ceil(cx + rx))
    const y0 = Math.max(0, Math.floor(cy - ry)), y1 = Math.min(H - 1, Math.ceil(cy + ry))
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry)
      if (d >= 1) continue
      const band = d < 0.4 ? 0 : d < 0.7 ? 1 : 2
      const k = BANDS[band] * strong
      const i = (y * W + x) * 4
      if (emissive(i)) continue
      const tint = [0.55 + 0.45 * (c[0] / 255), 0.55 + 0.45 * (c[1] / 255), 0.55 + 0.45 * (c[2] / 255)]
      for (let ch = 0; ch < 3; ch++) {
        const target = lit.d[i + ch] * tint[ch] * 1.0
        const cur = img.d[i + ch]
        if (target > cur) img.d[i + ch] = clamp(cur + (target - cur) * k)
      }
    }
  }
  // moonlight through the two windows: slanted patches on the floor with the window bars as dark gaps
  for (const wn of L.wall.filter((w) => w.id.startsWith('window-'))) {
    const gx0 = wn.px + 5, gx1 = wn.px + 70
    for (let y = 100; y < 156; y++) {
      const t = y - 100
      const shift = Math.round(t * 0.45)
      for (let x = gx0 + shift; x <= gx1 + shift; x++) {
        const lx = x - gx0 - shift
        if ((lx >= 21 && lx <= 22) || (lx >= 43 && lx <= 44)) continue // vertical bars
        if (t >= 22 && t <= 25) continue // horizontal bar
        const edge = lx < 2 || lx > 63 || t < 2 || t > 52
        const i = (y * W + x) * 4
        if (x < 16 || x >= W - 16 || emissive(i)) continue
        const k = edge ? 0.18 : 0.34
        const c = [150, 172, 240]
        for (let ch = 0; ch < 3; ch++) {
          const target = Math.min(255, lit.d[i + ch] * 0.7 + c[ch] * 0.35)
          if (target > img.d[i + ch]) img.d[i + ch] = clamp(img.d[i + ch] + (target - img.d[i + ch]) * k)
        }
      }
    }
  }
  for (const l of [...L.lights, ...extraLights]) pool(l.x, l.y, l.rx, l.ry, l.c, l.strong ? 1.25 : l.small ? 0.8 : 1)
  return img
}
