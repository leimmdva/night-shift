// Toolkit for the office map pieces. Builds on lib.mjs (same Mask/volume/outline functions as the monsters).
// Differences from the monster sprites:
//  - cells hold '#RRGGBB' (or '#RRGGBBAA') strings instead of single legend characters; saveOffice() assigns characters.
//  - camera is a pure top-down 3/4: every box shows a lit TOP face and a FRONT face (no side face).
//  - contact shadows are one flat semi-transparent colour (SH), cast to the bottom-right (light is top-left).
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Canvas, rect, ellipse, poly, outline, volume, fill, fillRect, lineCells } from './lib.mjs'

export * from './lib.mjs'

export const OFFICE_SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'office')

// 4-step ramps (h highlight, l light, b base, s shadow) plus o = the darkest shade, used for outlines.
const m = (h, l, b, s, o, r) => ({ h, l, b, s, o, r })
export const MAT = {
  wall: m('#EBDDBB', '#D9C79F', '#C2AC82', '#9B8662', '#3B2E21'),
  wallCap: m('#F7EED8', '#E6D9B8', '#CFBF99', '#A8977A', '#3B2E21'),
  board: m('#9B7B62', '#7C5F4A', '#634A39', '#47342A', '#1E130E'),
  wood: m('#E0A870', '#C28650', '#9E6633', '#744522', '#2E180C'),
  woodDark: m('#A9876B', '#876A53', '#6B523F', '#4D3A2D', '#21150E'),
  metal: m('#C9D9E6', '#9DB3C7', '#7790A8', '#536B85', '#1C2838'),
  cabinet: m('#B4CCC0', '#8EAEA6', '#6C8E8A', '#4D6A68', '#1A2B2A'),
  white: m('#FFFFFF', '#EEEBF4', '#D2CEE0', '#9893B2', '#2E2B47'),
  plastic: m('#6A7088', '#474C63', '#32364A', '#232638', '#0B0C14'),
  steel: m('#9DB0B0', '#74898E', '#566A74', '#3B4C5A', '#141D26'),
  sofa: m('#6FC9BE', '#3FA39E', '#2C7C82', '#1E5663', '#0B2430'),
  chair: m('#7D8FD6', '#5D6EB8', '#46549A', '#323C78', '#12163A'),
  chairTeal: m('#7DD6C4', '#4DB5A6', '#3A9088', '#276866', '#0C2A2C'),
  clothBlack: m('#6B5A86', '#4D3F68', '#352A4C', '#231B36', '#08050F'),
  clothPurple: m('#B592E8', '#9066D0', '#6E48A8', '#4C3080', '#1C0F3A'),
  trim: m('#FFD070', '#FF9F30', '#F07818', '#B04A12', '#4A1A08'),
  leaf: m('#B4EC7A', '#6CCB52', '#3FA040', '#287040', '#0E2E22'),
  leafDark: m('#8ED66A', '#4FB048', '#338A3E', '#206238', '#0A261C'),
  pot: m('#E89A6A', '#C97650', '#A55A3E', '#7A3E2E', '#35170F'),
  pumpkin: m('#FFE08A', '#FFAE3A', '#F27C1A', '#B44A12', '#4A1A08', '#D96418'),
  stem: m('#B8D678', '#7FA04A', '#5C7A36', '#3E5628', '#1A2A12'),
  bone: m('#FFFFF2', '#F1EBD4', '#D8CFB0', '#A69E80', '#3A3424'),
  cardboard: m('#E6C58E', '#CDA56C', '#B08850', '#876436', '#3D2A14'),
  stone: m('#C5CAD6', '#A0A7B8', '#7C849A', '#59607A', '#1E2236'),
  jug: m('#E8F8FF', '#BFE6F8', '#8CCBEA', '#5A9CC4', '#1B3E5A'),
  doorTeal: m('#8FD0C8', '#5FAAA6', '#437F85', '#2E5662', '#0E2630'),
  mug: m('#FF8F7A', '#E5634F', '#BC4538', '#8A2E2C', '#32100E'),
  paper: m('#FFFFFF', '#F4F2EC', '#E2DDD0', '#B7B0A0', '#4A4438'),
  carpetA: m('#EBD5A8', '#DFC595', '#D0B284', '#B8976A', '#8A6B42'),
  carpetB: m('#E6CE9F', '#D9BC8B', '#C9A97A', '#B08F62', '#8A6B42'),
  plank: m('#F0DDB4', '#E2C998', '#D3B687', '#BD9B6C', '#8A6B42'),
  plankDk: m('#DDBF90', '#CFAF80', '#C09F70', '#A98859', '#7E6038'),
}

export const SH = '#2A140A8C' // contact shadow (flat, one alpha level)
export const SH2 = '#2A140A55' // faint outer shadow

// Colours that stay lit when the lights go out (screens, bulbs, glowing faces, LEDs, windows, EXIT sign).
export const GLOW = {
  scrBlueBg: '#1F4E8C', scrBlueTx: '#8FD3FF', scrBlueHi: '#4C8BD0',
  scrGreenBg: '#0F3A2A', scrGreenTx: '#6BF29A', scrGreenHi: '#2E7A56',
  amber: '#E8A33D', amberDk: '#B8741F', amberHi: '#F7CC7E',
  pumpkinFace: '#FFD25A', pumpkinCore: '#FFF3B0', pumpkinEdge: '#FFAA33',
  bulbOr: '#FFB347', bulbOrHi: '#FFE8B0', bulbPu: '#B76CFF', bulbPuHi: '#EBD3FF',
  ledG: '#5CF08A', ledA: '#FFB02E', ledR: '#FF5B4A',
  exit: '#4CE08A', exitHi: '#C2FFD8',
  skyA: '#0B1230', skyB: '#122046', skyC: '#1B2E5E', skyD: '#27407A', moon: '#F7F2D2', moonDk: '#C9C4A0', star: '#E8F0FF', city: '#FFD27A', cityDk: '#8EC8FF',
  serverSign: '#FFB02E',
}
export const EMISSIVE = new Set(Object.values(GLOW))

// ------------------------------------------------------------------ small helpers
export const rnd = (x, y, s = 0) => {
  let h = (Math.imul(x + 1013, 374761393) + Math.imul(y + 7919, 668265263) + Math.imul(s + 17, 2147483647)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export function put(cv, x, y, c) { cv.set(x, y, c) }
export function putIfEmpty(cv, x, y, c) { if (cv.get(Math.round(x), Math.round(y)) === '.') cv.set(x, y, c) }
export const R = (cv, x0, y0, x1, y1) => rect(cv.w, cv.h, x0, y0, x1, y1)
export const E = (cv, cx, cy, rx, ry) => ellipse(cv.w, cv.h, cx, cy, rx, ry)
export const P = (cv, pts) => poly(cv.w, cv.h, pts)

// Flat contact shadow on the floor under/behind a footprint [x0..x1] whose bottom edge is at y. Draw it BEFORE the body.
export function castShadow(cv, x0, x1, y, o = {}) {
  const d = o.depth ?? 3, sh = o.shift ?? 3
  for (let yy = y - 2; yy <= y + d; yy++) {
    const t = yy - (y - 2)
    const a = t === d + 2 ? 2 : 0 // clip the corners of the last row
    for (let xx = x0 + 1 + a; xx <= x1 + sh - (yy > y ? 1 : 0) - a; xx++) putIfEmpty(cv, xx, yy, yy > y + d - 1 ? SH2 : SH)
  }
}
export function ellipseShadow(cv, cx, cy, rx, ry, c = SH) {
  for (const [x, y] of E(cv, cx, cy, rx, ry).cells()) putIfEmpty(cv, x, y, c)
}

// Box with a top face (td rows) and a front face. Region x0..x1, y0..y1, top face on y0..y0+td-1.
export function cuboid(cv, x0, y0, x1, y1, td, M, o = {}) {
  const all = R(cv, x0, y0, x1, y1)
  const topM = R(cv, x0, y0, x1, y0 + td - 1)
  const frontM = R(cv, x0, y0 + td, x1, y1)
  for (const [x, y] of topM.cells()) cv.set(x, y, o.topC ?? M.l)
  for (let x = x0; x <= x1; x++) cv.set(x, y0, M.h)
  for (let y = y0; y < y0 + td; y++) cv.set(x0, y, M.h)
  const fy = y0 + td
  for (const [x, y] of frontM.cells()) cv.set(x, y, o.frontC ?? M.b)
  if (o.edge !== false) for (let x = x0; x <= x1; x++) cv.set(x, fy, M.h)
  for (let y = fy; y <= y1; y++) { cv.set(x0, y, M.l); cv.set(x1, y, M.s) }
  const bot = o.bot ?? 2
  for (let y = y1 - bot + 1; y <= y1; y++) for (let x = x0 + 1; x <= x1; x++) cv.set(x, y, M.s)
  if (o.grain) {
    for (const [x, y] of topM.cells()) if (x > x0 + 1 && x < x1 - 3 && y > y0 && rnd(x, y, o.grain) < 0.05) for (let k = 0; k < 3; k++) cv.set(x + k, y, M.b)
  }
  if (o.outline !== false) outline(cv, all, M.o)
  return { all, topM, frontM }
}

// Flat vertical face (wall-mounted or door-like): lit left/top edge, shadowed right/bottom edge.
export function face(cv, x0, y0, x1, y1, M, o = {}) {
  const all = R(cv, x0, y0, x1, y1)
  fill(cv, all, o.c ?? M.b)
  for (let x = x0; x <= x1; x++) { cv.set(x, y0, M.h); cv.set(x, y1, M.s) }
  for (let y = y0; y <= y1; y++) { cv.set(x0, y, M.l); cv.set(x1, y, M.s) }
  cv.set(x0, y0, M.h); cv.set(x0, y1, M.s)
  if (o.outline !== false) outline(cv, all, M.o)
  return all
}

export function vol(cv, mask, Mt, o = {}) {
  volume(cv, mask, Mt, { rad: 4, ...o })
  if (o.outline !== false) outline(cv, mask, Mt.o)
}

export function seg(cv, pts, c) {
  for (let i = 0; i < pts.length - 1; i++) for (const [x, y] of lineCells(...pts[i], ...pts[i + 1])) cv.set(x, y, c)
}
export function dotsAt(cv, pts, c) { for (const [x, y] of pts) cv.set(x, y, c) }
export function recolor(cv, from, to) {
  for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) if (cv.get(x, y) === from) cv.set(x, y, to)
}
// Blit one canvas onto another at (ox, oy); '.' is skipped.
export function blit(dst, src, ox, oy) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const c = src.get(x, y); if (c !== '.') dst.set(ox + x, oy + y, c) }
}
export function flipH(src) {
  const o = new Canvas(src.w, src.h)
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) o.set(src.w - 1 - x, y, src.get(x, y))
  return o
}

// ------------------------------------------------------------------ 3x5 pixel font (a-z, 0-9 and a few signs)
export const FONT = {
  a: '010101111101101', b: '110101110101110', c: '011100100100011', d: '110101101101110',
  e: '111100110100111', f: '111100110100100', g: '011100101101011', h: '101101111101101',
  i: '111010010010111', j: '001001001101010', k: '101101110101101', l: '100100100100111',
  m: '101111111101101', n: '110101101101101', o: '010101101101010', p: '110101110100100',
  q: '010101101111011', r: '110101110101101', s: '011100010001110', t: '111010010010010',
  u: '101101101101111', v: '101101101101010', w: '101101111111101', x: '101101010101101',
  y: '101101010010010', z: '111001010100111', '-': '000000111000000',
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001',
  5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111',
  ':': '000010000010000', '.': '000000000000010', '!': '010010010000010', '/': '001001010100100',
}
export const textW = (t, s = 1) => (t.length * 4 - 1) * s
export function drawText(cv, x, y, text, c, s = 1) {
  let cx = x
  for (const ch of text.toLowerCase()) {
    const g = FONT[ch]
    if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') {
      for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) cv.set(cx + (i % 3) * s + a, y + Math.floor(i / 3) * s + b, c)
    }
    cx += 4 * s
  }
}

// ------------------------------------------------------------------ saving
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!$%&*+/:;<=>?^_~|'
export const MAX_OFFICE_COLOURS = ALPHABET.length

// meta: feet = row of the floor-contact line of the body inside the sprite, ax = column where the body's left edge sits.
export function saveOffice(name, cv, meta = {}, title = name) {
  const used = new Map()
  for (const c of cv.g.flat()) if (c !== '.' && !used.has(c)) used.set(c, null)
  if (used.size > MAX_OFFICE_COLOURS) throw new Error(`${name}: ${used.size} colours`)
  const colours = [...used.keys()].sort()
  colours.forEach((c, i) => used.set(c, ALPHABET[i]))
  const text = [
    `# ${title} (${cv.w}x${cv.h})`,
    "# Generated by scripts/sprites/draw/draw-office.mjs. '.' = transparent; every other character is one pixel.",
    `# meta feet=${meta.feet ?? cv.h} ax=${meta.ax ?? 0}`,
    ...colours.map((c) => `@ ${used.get(c)} ${c}`),
    '---',
    ...cv.g.map((r) => r.map((c) => (c === '.' ? '.' : used.get(c))).join('')),
    '',
  ].join('\n')
  mkdirSync(OFFICE_SRC, { recursive: true })
  writeFileSync(join(OFFICE_SRC, `${name}.txt`), text)
  console.log(`office/${name}: ${cv.w}x${cv.h}, ${used.size} colours`)
}

