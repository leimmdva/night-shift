// Builds docs/art/dialogue-preview.png and docs/art/dialogue-preview-player.png: a 1280x720 mock of the intro dialogue screen.
// Layout: player portrait on the left, boss portrait on the right (6x, standing on the bottom edge, the listener dimmed),
// a dialogue bar between them made from the UI kit (9-slice panel, name tag on top, "more" arrow bottom right, Press Start 2P at 3x),
// over the lit office, slightly blurred and dimmed. Only whole-number scales are used for art and UI.
// Run `node scripts/sprites/build-dialogue-preview.mjs` after `npm run build-ui` and `npm run build-portraits`.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateSync } from 'node:zlib'
import { encodePng, makeImage, blend, scale } from './png.mjs'
import { loadOffice } from './office-assets.mjs'
import { buildLayout } from './office-layout.mjs'
import { renderBase, lightsOn } from './office-compose.mjs'
import { parseGrid } from './portrait-grid.mjs'
import { drawText, textWidth, wrap } from './pixel-font.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const W = 1280, H = 720
const PORTRAIT = 6, UI = 3
const INK = '#2E1E26'

const ui = JSON.parse(readFileSync(join(root, 'public/sprites/ui/ui.json'), 'utf8'))
// minimal PNG reader for the UI kit pieces (8-bit RGBA, the format png.mjs writes)
function loadPng(path) {
  const buf = readFileSync(path)
  let o = 8, w = 0, h = 0
  const idat = []
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8)
    if (type === 'IHDR') { w = buf.readUInt32BE(o + 8); h = buf.readUInt32BE(o + 12); if (buf[o + 8 + 8] !== 8 || buf[o + 8 + 9] !== 6) throw new Error(`${path}: expected 8-bit RGBA`) }
    if (type === 'IDAT') idat.push(buf.subarray(o + 8, o + 8 + len))
    o += 12 + len
  }
  const raw = inflateSync(Buffer.concat(idat))
  const d = new Uint8Array(w * h * 4), stride = w * 4
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? d[y * stride + x - 4] : 0, b = y ? d[(y - 1) * stride + x] : 0, c = x >= 4 && y ? d[(y - 1) * stride + x - 4] : 0
      let v = line[x]
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c }
      d[y * stride + x] = v & 255
    }
  }
  return { w, h, d }
}
const piece = (n) => loadPng(join(root, `public/sprites/ui/${n}.png`))

function nine(dst, name, x, y, w, h) {
  const t = piece(name)
  const [l, tp, r, b] = ui[name].slice
  const map = (d, size, a, c, tsize) => (d < a ? d : d >= size - c ? tsize - (size - d) : a + Math.floor(((d - a) * (tsize - a - c)) / (size - a - c)))
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) {
    const si = (map(dy, h, tp, b, t.h) * t.w + map(dx, w, l, r, t.w)) * 4
    if (t.d[si + 3] === 0) continue
    blend(dst, { w: 1, h: 1, d: t.d.subarray(si, si + 4) }, x + dx, y + dy)
  }
}

// ---- background: lit office, 2x, cropped, blurred, dimmed ----
function boxBlur(img, r) {
  const { w, h, d } = img
  const tmp = new Float32Array(d.length)
  const pass = (src, dst, horiz) => {
    const n = horiz ? w : h, m = horiz ? h : w
    for (let j = 0; j < m; j++) for (let c = 0; c < 3; c++) {
      let sum = 0
      const at = (i) => { const k = Math.min(n - 1, Math.max(0, i)); return src[((horiz ? j * w + k : k * w + j) * 4) + c] }
      for (let i = -r; i <= r; i++) sum += at(i)
      for (let i = 0; i < n; i++) {
        dst[((horiz ? j * w + i : i * w + j) * 4) + c] = sum / (2 * r + 1)
        sum += at(i + r + 1) - at(i - r)
      }
    }
  }
  const a = Float32Array.from(d)
  for (let k = 0; k < 3; k++) { pass(a, tmp, true); pass(tmp, a, false) }
  for (let i = 0; i < d.length; i += 4) { d[i] = a[i]; d[i + 1] = a[i + 1]; d[i + 2] = a[i + 2]; d[i + 3] = 255 }
}
function background() {
  const S = loadOffice()
  const L = buildLayout(S)
  const big = scale(lightsOn(renderBase(L, S)), 2) // 1280 x 896
  const Y0 = 16
  const img = makeImage(W, H)
  img.d.set(big.d.subarray(Y0 * W * 4, (Y0 + H) * W * 4))
  boxBlur(img, 3)
  for (let i = 0; i < img.d.length; i += 4) { // dim, slightly towards warm dusk
    img.d[i] = Math.round(img.d[i] * 0.58 + 10); img.d[i + 1] = Math.round(img.d[i + 1] * 0.54 + 6); img.d[i + 2] = Math.round(img.d[i + 2] * 0.52 + 6)
  }
  return img
}

const portrait = (name, dim) => {
  const g = parseGrid(readFileSync(join(root, `scripts/sprites/src/portraits/${name}.txt`), 'utf8'), name)
  const img = { w: g.w, h: g.h, d: Uint8Array.from(g.px) }
  if (dim) for (let i = 0; i < img.d.length; i += 4) for (let k = 0; k < 3; k++) img.d[i + k] = Math.round(img.d[i + k] * 0.5)
  return scale(img, PORTRAIT)
}

// ---- the dialogue bar, drawn at 1x logical pixels then scaled by UI ----
function bar(speaker, text) {
  const PW = 212, PAD = 8, LINE = 12
  const lines = wrap(text, Math.floor((PW - 2 * PAD) / 8))
  if (lines.length > 4) throw new Error(`dialogue text needs ${lines.length} lines, the bar holds 4`)
  const PH = 64 // room for four lines of text and the arrow; the same height for every line
  const TAG_H = 20, tagW = textWidth(speaker) + 14
  const img = makeImage(PW, TAG_H - 2 + PH)
  const py = TAG_H - 2
  nine(img, 'panel', 0, py, PW, PH)
  nine(img, 'tab-active-normal', 10, 0, tagW, TAG_H)
  drawText(img, speaker, 10 + 7, 7, ui['tab-active-normal'].label)
  lines.forEach((l, i) => drawText(img, l, PAD + 2, py + PAD + 2 + i * LINE, INK))
  blend(img, piece('more-arrow'), PW - 17, py + PH - 15)
  return scale(img, UI)
}

function render(file, speaker, text, left, right) {
  const img = background()
  const l = portrait(left.name, left.dim), r = portrait(right.name, right.dim)
  const feet = 2 * PORTRAIT // the 2px transparent margin under the feet is pushed off the bottom edge
  blend(img, l, 40, H - l.h + feet)
  blend(img, r, W - 40 - r.w, H - r.h + feet)
  const b = bar(speaker, text)
  blend(img, b, Math.round((W - b.w) / 2), H - 28 - b.h)
  writeFileSync(join(root, file), encodePng(W, H, img.d))
}

render('docs/art/dialogue-preview.png', 'BOSS', "The release is at 8:30 tomorrow. There are eight open bugs. I'm sure you'll be fine.",
  { name: 'player', dim: true }, { name: 'boss', dim: false })
render('docs/art/dialogue-preview-player.png', 'YOU', 'Wait... all eight? Tonight?',
  { name: 'player-worried', dim: false }, { name: 'boss-stern', dim: true })
console.log('dialogue previews written')
