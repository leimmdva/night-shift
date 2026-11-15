// Halloween decorations and small desk items. The draw* functions work on any canvas so desks can reuse them;
// the exported jobs write each decoration as its own sprite.
import {
  Canvas, MAT, GLOW, SH, castShadow, cuboid, face, vol, seg, put, putIfEmpty, R, E, P, rnd, outline, fill,
  drawText, textW, saveOffice, dotsAt, ellipseShadow, flipH, blit,
} from './office-lib.mjs'

const INK = '#17102A'
const INK2 = '#3A2C5C'
const WEB = '#EEF1FAB4'

// ------------------------------------------------------------------ jack-o'-lantern (glowing face)
export function drawPumpkin(cv, cx, by, r, o = {}) {
  const ry = Math.max(4, Math.round(r * 0.82))
  const cy = by - ry
  if (o.glow !== false) for (const [x, y] of E(cv, cx, by - 1, r + 5, 3).cells()) putIfEmpty(cv, x, y, '#FF9A2E38')
  const lobe = (dx, rx) => E(cv, cx + dx, cy, rx, ry)
  const body = lobe(0, r * 0.62).or(lobe(-r * 0.42, r * 0.6)).or(lobe(r * 0.42, r * 0.6))
  vol(cv, body, MAT.pumpkin, { rad: r * 0.9 })
  // grooves between the lobes
  for (const gx of [-r * 0.36, r * 0.36]) {
    for (let y = cy - ry + 2; y <= cy + ry - 2; y++) {
      const t = (y - cy) / ry
      const x = Math.round(cx + gx * (1 - 0.25 * t * t))
      if (cv.get(x, y) !== '.' && cv.get(x, y) !== MAT.pumpkin.o) cv.set(x, y, MAT.pumpkin.s)
    }
  }
  // stem
  const sx = cx - 1, sy = cy - ry - 1
  const stem = R(cv, sx, sy - 2, sx + 2, sy + 1)
  fill(cv, stem, MAT.stem.b)
  for (let y = sy - 2; y <= sy + 1; y++) cv.set(sx, y, MAT.stem.l)
  for (let y = sy - 2; y <= sy + 1; y++) cv.set(sx + 2, y, MAT.stem.s)
  outline(cv, stem, MAT.stem.o)
  // carved face
  const t = Math.max(2, Math.round(r * 0.3))
  const ey = cy - ry * 0.12
  const tri = (xl, xr, yb, yt) => P(cv, [[xl, yb], [xr, yb], [(xl + xr) / 2, yt]])
  let face = tri(cx - r * 0.62, cx - r * 0.62 + t * 1.6, ey, ey - t * 1.5)
    .or(tri(cx + r * 0.62 - t * 1.6, cx + r * 0.62, ey, ey - t * 1.5))
    .or(tri(cx - t * 0.5, cx + t * 0.5 + 0.6, cy + ry * 0.28, cy + ry * 0.28 - t * 0.9))
  const my = cy + ry * 0.34
  const mw = r * 0.62
  const zig = [[cx - mw, my]]
  const teeth = Math.max(3, Math.round(r / 1.8))
  for (let i = 1; i <= teeth * 2; i++) zig.push([cx - mw + (i * mw) / teeth, my + (i % 2 ? t * 0.7 : -t * 0.1)])
  const botPts = zig.map(([x, y]) => [x, y]).reverse().map(([x, y]) => [x, y + t * 0.55])
  face = face.or(P(cv, [...zig, ...botPts]))
  for (const [x, y] of face.cells()) {
    const edge = !face.has(x - 1, y) || !face.has(x + 1, y) || !face.has(x, y - 1) || !face.has(x, y + 1)
    cv.set(x, y, edge ? GLOW.pumpkinEdge : GLOW.pumpkinFace)
  }
  for (const [x, y] of face.cells()) {
    if (face.has(x - 1, y) && face.has(x + 1, y) && face.has(x, y - 1) && face.has(x, y + 1)) cv.set(x, y, GLOW.pumpkinCore)
  }
}

// ------------------------------------------------------------------ witch hat
export function drawWitchHat(cv, cx, by) {
  const M = MAT.clothBlack
  const brim = E(cv, cx, by - 2, 9, 2.8)
  vol(cv, brim, M, { rad: 2.5 })
  const lower = P(cv, [[cx - 5, by - 3], [cx + 5, by - 3], [cx + 3, by - 10], [cx - 3, by - 10]])
  vol(cv, lower, M, { rad: 4 })
  const tip = P(cv, [[cx - 3, by - 10], [cx + 3, by - 10], [cx + 8, by - 15], [cx + 5.5, by - 16.2], [cx + 1.5, by - 13]])
  vol(cv, tip, M, { rad: 3 })
  // orange band and buckle
  for (let x = cx - 4; x <= cx + 4; x++) { cv.set(x, by - 5, MAT.trim.l); cv.set(x, by - 4, MAT.trim.b) }
  cv.set(cx, by - 5, GLOW.pumpkinFace); cv.set(cx + 1, by - 5, GLOW.pumpkinFace)
}

// ------------------------------------------------------------------ paper bats
const BAT_A = [
  '.X.........X.',
  'XXX..X.X..XXX',
  'XXXXXXXXXXXXX',
  '.XXX.XXX.XXX.',
  '..X...X...X..',
]
const BAT_B = [
  'X...........X',
  'XX..X...X..XX',
  'XXXXXXXXXXXXX',
  '.XXXXXXXXXXX.',
  '..X.XXXXX.X..',
]
export function drawBat(cv, x, y, v = 0, ink = INK) {
  const pat = v === 0 ? BAT_A : BAT_B
  pat.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') cv.set(x + i, y + j, ink) }))
  cv.set(x + 5, y + 2, INK2); cv.set(x + 7, y + 2, INK2) // eyes' ridge
  cv.set(x + 6, y + 1, INK2)
  // tape at the wing tips
  cv.set(x, y - 1, '#E8DFA4C8'); cv.set(x + 12, y - 1, '#E8DFA4C8')
}

// ------------------------------------------------------------------ cobweb in the top-left corner of a w x w box
export function drawWeb(cv, ox, oy, w, o = {}) {
  const L = w - 1
  const ang = [0, 22.5, 45, 67.5, 90].map((a) => (a * Math.PI) / 180)
  const pt = (i, r) => [ox + Math.cos(ang[i]) * r, oy + Math.sin(ang[i]) * r]
  for (let i = 0; i < ang.length; i++) seg(cv, [[ox, oy], pt(i, L)], WEB)
  for (const r of [w * 0.22, w * 0.42, w * 0.64, w * 0.88]) {
    for (let i = 0; i < ang.length - 1; i++) {
      const [a, b] = [pt(i, r), pt(i + 1, r)]
      const mid = [(a[0] + b[0]) / 2 - (a[0] + b[0] - 2 * ox) * 0.09, (a[1] + b[1]) / 2 - (a[1] + b[1] - 2 * oy) * 0.09]
      seg(cv, [a, mid, b], WEB)
    }
  }
  if (o.drip) seg(cv, [pt(2, L), [ox + L * 0.75, oy + L * 0.75 + 4]], WEB)
}

// ------------------------------------------------------------------ spider on a thread
export function drawSpider(cv, cx, top, len) {
  for (let y = top; y < top + len; y++) cv.set(cx, y, '#E4E0F0C0')
  const by = top + len + 3
  const SP = { h: '#7A6AA0', l: '#4A3C70', b: '#2E2548', s: '#1E1832', o: '#08050F' }
  const legs = (dir) => {
    for (const [dy, dx, ex, ey] of [[-2, 2, 5, -4], [-1, 3, 6, -1], [0, 3, 6, 2], [1, 2, 5, 5]]) {
      seg(cv, [[cx + dir * dx, by + dy], [cx + dir * (dx + 2), by + dy - (dy < 0 ? 2 : -1)], [cx + dir * ex, by + ey]], SP.o)
    }
  }
  legs(-1); legs(1)
  vol(cv, E(cv, cx, by + 0.5, 3.2, 3.4), SP, { rad: 3 })
  cv.set(cx - 1, by - 1, '#FFFFFF'); cv.set(cx + 1, by - 1, '#FFFFFF')
  cv.set(cx, by + 2, '#E5483A'); cv.set(cx, by + 3, '#E5483A')
}

// ------------------------------------------------------------------ string lights
function bulb(cv, x, wy, kind) {
  const [c, hi, halo] = kind === 0 ? [GLOW.bulbOr, GLOW.bulbOrHi, '#FFB34740'] : [GLOW.bulbPu, GLOW.bulbPuHi, '#B76CFF40']
  for (const [hx, hy] of E(cv, x, wy + 4, 4.4, 4.4).cells()) putIfEmpty(cv, hx, hy, halo)
  cv.set(x, wy + 1, '#2A1E1A')
  for (const [dx, dy] of [[-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [0, 2], [-1, 2], [1, 2]]) cv.set(x + dx, wy + 2 + dy, c)
  cv.set(x - 1, wy + 2, hi); cv.set(x - 1, wy + 3, hi)
  cv.set(x + 1, wy + 4, kind === 0 ? '#E8721A' : '#7C3FD0')
  cv.set(x, wy + 5, kind === 0 ? '#E8721A' : '#7C3FD0')
}
export function drawSwag(cv, x0, x1, y0, sag, xs, first = 0) {
  const wy = (x) => Math.round(y0 + sag * Math.sin((Math.PI * (x - x0)) / (x1 - x0)))
  for (const x of xs) bulb(cv, x, wy(x), (xs.indexOf(x) + first) % 2)
  for (let x = x0; x <= x1; x++) cv.set(x, wy(x), '#2A1E1A')
}

// ------------------------------------------------------------------ HAPPY HALLOWEEN pennant banner
export function drawBanner(cv, x0, y0) {
  const words = ['HAPPY', 'HALLOWEEN']
  let x = x0
  const rope = []
  words.forEach((word, wi) => {
    const span = word.length * 8
    const sag = (xx) => Math.round(3.5 * Math.sin((Math.PI * (xx - x)) / span))
    const startX = x
    for (let xx = startX; xx <= startX + span; xx++) cv.set(xx, y0 + sag(xx), '#2A1E1A')
    ;[...word].forEach((ch, i) => {
      const fx = startX + 1 + i * 8
      const fy = y0 + sag(fx + 3) + 1
      const orange = (i + wi) % 2 === 0
      const M = orange ? MAT.trim : MAT.clothPurple
      const mask = P(cv, [[fx, fy], [fx + 7, fy], [fx + 7, fy + 8], [fx + 3.5, fy + 10.5], [fx, fy + 8]])
      fill(cv, mask, M.b)
      for (const [mx, my] of mask.cells()) {
        if (!mask.has(mx - 1, my) || !mask.has(mx, my - 1)) cv.set(mx, my, M.h)
        else if (!mask.has(mx + 1, my) || !mask.has(mx + 1, my + 1) || !mask.has(mx, my + 2)) cv.set(mx, my, M.s)
      }
      outline(cv, mask, M.o)
      drawText(cv, fx + 2, fy + 2, ch, orange ? '#2A1030' : '#FFF1C8')
      rope.push(fx)
    })
    x = startX + span + 6
  })
  return x - 6 - x0
}

// ------------------------------------------------------------------ candy bowl and wrappers
const CANDY = ['#FF8A1F', '#B76CFF', '#5FD068', '#FF5FA8', '#FFE04A']
export function drawCandyBowl(cv, cx, by) {
  const bowl = E(cv, cx, by - 3, 6.5, 3.2).or(R(cv, cx - 6, by - 6, cx + 6, by - 4))
  const lower = bowl.minus(R(cv, 0, 0, cv.w, by - 5))
  // heap of candy sits above the rim
  const heap = E(cv, cx, by - 6, 5.6, 3.4)
  for (const [x, y] of heap.cells()) {
    const k = Math.floor(rnd(Math.floor(x / 2), Math.floor(y / 2), 5) * CANDY.length)
    cv.set(x, y, CANDY[k])
  }
  outline(cv, heap, '#3A2418')
  vol(cv, lower, MAT.white, { rad: 3 })
  for (let x = cx - 5; x <= cx + 5; x++) cv.set(x, by - 5, MAT.white.h)
  dotsAt(cv, [[cx - 3, by - 8], [cx + 1, by - 9], [cx + 3, by - 7]], '#FFFFFF')
}
export function drawWrapper(cv, x, y, k) {
  const c = CANDY[k % CANDY.length]
  cv.set(x, y + 1, c); cv.set(x + 1, y, c); cv.set(x + 1, y + 1, c); cv.set(x + 2, y + 1, c); cv.set(x + 2, y, c); cv.set(x + 3, y + 1, c)
  cv.set(x + 1, y + 1, '#FFFFFFB0')
}

// ------------------------------------------------------------------ desk items shared by several desks
export function drawMonitor(cv, x, y, screen = 'blue', seed = 1) {
  const w = 22, h = 16
  const cx = x + 11
  cuboid(cv, cx - 5, y + h + 1, cx + 4, y + h + 3, 1, MAT.plastic, { bot: 1 })
  face(cv, cx - 1, y + h - 2, cx + 1, y + h + 1, MAT.plastic)
  face(cv, x, y, x + w - 1, y + h - 1, MAT.plastic)
  const [bg, tx, hi] = screen === 'green' ? [GLOW.scrGreenBg, GLOW.scrGreenTx, GLOW.scrGreenHi]
    : screen === 'amber' ? [GLOW.amberDk, GLOW.amberHi, GLOW.amber]
      : [GLOW.scrBlueBg, GLOW.scrBlueTx, GLOW.scrBlueHi]
  const sx0 = x + 2, sy0 = y + 2, sx1 = x + w - 3, sy1 = y + h - 5
  for (let yy = sy0; yy <= sy1; yy++) for (let xx = sx0; xx <= sx1; xx++) cv.set(xx, yy, bg)
  for (let r = 0; r < 4; r++) {
    const ind = Math.floor(rnd(r, seed, 3) * 4)
    const len = 4 + Math.floor(rnd(r, seed, 9) * 9)
    for (let i = 0; i < len && sx0 + 1 + ind + i <= sx1 - 1; i++) cv.set(sx0 + 1 + ind + i, sy0 + 1 + r * 2, i < 3 ? hi : tx)
  }
  cv.set(sx0, sy0, tx); cv.set(sx0 + 1, sy0, tx)
  cv.set(x + 1, y + h - 2, '#7CE08C') // power LED
}
export function drawKeyboard(cv, x, y) {
  cuboid(cv, x, y, x + 14, y + 4, 3, MAT.white, { bot: 1 })
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) cv.set(x + 2 + i * 2, y + 1 + r, MAT.white.s)
}
export function drawMouse(cv, x, y) { vol(cv, E(cv, x + 1.5, y + 1.5, 2.2, 1.8), MAT.white, { rad: 2 }) }
export function drawMug(cv, x, by, M = MAT.mug) {
  const body = R(cv, x, by - 4, x + 3, by)
  fill(cv, body, M.b)
  for (let y = by - 4; y <= by; y++) { cv.set(x, y, M.l); cv.set(x + 3, y, M.s) }
  cv.set(x, by - 4, M.h)
  outline(cv, body, M.o)
  cv.set(x + 4, by - 3, M.o); cv.set(x + 5, by - 2, M.o); cv.set(x + 4, by - 1, M.o)
  for (let xx = x + 1; xx <= x + 2; xx++) cv.set(xx, by - 4, '#5A3A28')
}
export function drawSticky(cv, x, y, c = '#FFE86A') {
  fill(cv, R(cv, x, y, x + 3, y + 3), c)
  for (let i = 0; i < 3; i++) cv.set(x + i, y + 3, '#D8B83A')
  cv.set(x + 1, y + 1, '#8A7A30'); cv.set(x + 2, y + 1, '#8A7A30')
}
export function drawPapers(cv, x, y) {
  const a = R(cv, x, y, x + 7, y + 5)
  fill(cv, a, MAT.paper.b)
  for (let i = 0; i < 8; i++) cv.set(x + i, y, MAT.paper.h)
  for (let i = 1; i < 7; i += 2) for (let k = 1; k < 6; k++) cv.set(x + k, y + i + 1, MAT.paper.s)
  outline(cv, a, MAT.paper.o)
}

// ------------------------------------------------------------------ plants (shared by desks and the plant sprites)
export function drawLeafBlob(cv, cx, cy, rx, ry, M = MAT.leaf) {
  const m = E(cv, cx, cy, rx, ry)
  vol(cv, m, M, { rad: Math.min(rx, ry) + 1 })
}
export function drawPotPlant(cv, cx, by, scale = 1) {
  const pw = Math.round(5 * scale), ph = Math.round(7 * scale)
  const pot = P(cv, [[cx - pw, by - ph], [cx + pw, by - ph], [cx + pw - 2, by], [cx - pw + 2, by]])
  // leaves behind the rim first
  const lr = Math.round(5 * scale)
  drawLeafBlob(cv, cx - lr + 1, by - ph - lr, lr - 1, lr + 1, MAT.leafDark)
  drawLeafBlob(cv, cx + lr - 1, by - ph - lr + 1, lr - 1, lr, MAT.leaf)
  drawLeafBlob(cv, cx, by - ph - lr - 3 * scale, lr - 1, lr + 2, MAT.leaf)
  fill(cv, pot, MAT.pot.b)
  for (const [x, y] of pot.cells()) {
    if (y <= by - ph + 1) cv.set(x, y, MAT.pot.h)
    else if (!pot.has(x - 2, y)) cv.set(x, y, MAT.pot.l)
    else if (!pot.has(x + 2, y) || y >= by - 1) cv.set(x, y, MAT.pot.s)
  }
  outline(cv, pot, MAT.pot.o)
  for (let x = cx - pw + 1; x <= cx + pw - 1; x++) cv.set(x, by - ph + 2, MAT.pot.s)
}

// ================================================================== sprite jobs
export function pumpkinSmall() {
  const cv = new Canvas(24, 20)
  drawPumpkin(cv, 12, 17, 5)
  saveOffice('pumpkin_s', cv, { feet: 17, ax: 7 }, 'Jack-o-lantern (small)')
}
export function pumpkinMedium() {
  const cv = new Canvas(30, 24)
  drawPumpkin(cv, 15, 21, 7)
  saveOffice('pumpkin_m', cv, { feet: 21, ax: 8 }, 'Jack-o-lantern (medium)')
}
export function pumpkinLarge() {
  const cv = new Canvas(36, 32)
  castShadow(cv, 7, 29, 29)
  drawPumpkin(cv, 17, 29, 11)
  saveOffice('pumpkin_l', cv, { feet: 29, ax: 6 }, 'Jack-o-lantern (large, floor)')
}
export function witchHat() {
  const cv = new Canvas(24, 22)
  drawWitchHat(cv, 11, 19)
  saveOffice('witch_hat', cv, { feet: 19, ax: 2 }, 'Witch hat')
}
export function bats() {
  for (const v of [0, 1]) {
    const cv = new Canvas(15, 9)
    drawBat(cv, 1, 2, v)
    saveOffice(`bat_${v ? 'b' : 'a'}`, cv, { feet: 7, ax: 1 }, 'Paper bat')
  }
}
export function cobwebs() {
  const cv = new Canvas(28, 28)
  drawWeb(cv, 0, 0, 28)
  saveOffice('cobweb_corner', cv, { feet: 28, ax: 0 }, 'Cobweb (top-left corner, flip for the right)')
  const small = new Canvas(18, 18)
  drawWeb(small, 0, 0, 18, { drip: true })
  saveOffice('cobweb_small', small, { feet: 18, ax: 0 }, 'Small cobweb')
}
export function spider() {
  const cv = new Canvas(15, 40)
  drawSpider(cv, 7, 0, 28)
  saveOffice('spider_hanging', cv, { feet: 38, ax: 7 }, 'Hanging spider')
}
export function stringLights() {
  const cv = new Canvas(64, 14)
  drawSwag(cv, 0, 63, 1, 4, [8, 24, 40, 56], 0)
  saveOffice('string_lights', cv, { feet: 14, ax: 0 }, 'String lights (repeat every 64px)')
  const w = new Canvas(56, 16)
  drawSwag(w, 0, 55, 2, 4, [9, 27, 45], 1)
  saveOffice('string_lights_window', w, { feet: 16, ax: 0 }, 'String lights over a window')
}
export function banner() {
  const probe = new Canvas(200, 24)
  const w = drawBanner(probe, 1, 1)
  const cv = new Canvas(w + 3, 24)
  drawBanner(cv, 1, 1)
  saveOffice('banner_halloween', cv, { feet: 24, ax: 0 }, 'HAPPY HALLOWEEN banner')
}
export function candyBowl() {
  const cv = new Canvas(20, 16)
  castShadow(cv, 3, 16, 13, { depth: 2, shift: 2 })
  drawCandyBowl(cv, 10, 13)
  saveOffice('candy_bowl', cv, { feet: 13, ax: 4 }, 'Candy bowl')
}
export function wrappers() {
  for (let k = 0; k < 3; k++) {
    const cv = new Canvas(8, 5)
    drawWrapper(cv, 2, 1, [0, 1, 3][k])
    saveOffice(`wrapper_${'abc'[k]}`, cv, { feet: 4, ax: 2 }, 'Candy wrapper')
  }
}
export function exitSign() {
  const cv = new Canvas(26, 12)
  const body = face(cv, 2, 2, 23, 9, { h: '#2F7A56', l: '#1F5E42', b: '#154A34', s: '#0F3626', o: '#06150E' })
  for (let y = 3; y <= 8; y++) for (let x = 3; x <= 22; x++) cv.set(x, y, '#0F3626')
  drawText(cv, 7, 3, 'exit', GLOW.exit)
  for (let x = 6; x <= 19; x++) cv.set(x, 9, GLOW.exit)
  void body
  saveOffice('exit_sign', cv, { feet: 10, ax: 2 }, 'EXIT sign')
}
export function gravestone() {
  const cv = new Canvas(30, 38)
  castShadow(cv, 4, 25, 35, { depth: 2, shift: 3 })
  const slab = R(cv, 5, 12, 24, 33).or(E(cv, 15, 13, 10, 8))
  vol(cv, slab, MAT.stone, { rad: 6 })
  // engraved text and cracks
  drawText(cv, 9, 16, 'rip', MAT.stone.o)
  for (let x = 9; x <= 19; x++) cv.set(x, 23, MAT.stone.s)
  seg(cv, [[19, 19], [20, 22], [18, 25], [19, 28]], MAT.stone.s)
  // foam-prop look: chipped corner and a bit of grass at the foot
  dotsAt(cv, [[6, 14], [7, 13], [6, 15]], '.')
  const grass = ['#6CCB52', '#3FA040', '#287040']
  for (let x = 3; x <= 26; x += 2) {
    const h = 1 + Math.floor(rnd(x, 3, 2) * 3)
    for (let k = 0; k < h; k++) cv.set(x, 34 - k, grass[k % 3])
  }
  for (let x = 3; x <= 26; x++) cv.set(x, 34, '#287040')
  saveOffice('gravestone', cv, { feet: 34, ax: 4 }, 'Foam gravestone prop')
}
export function doormat() {
  const cv = new Canvas(54, 22)
  const mat = R(cv, 1, 1, 52, 20)
  fill(cv, mat, '#2A2438')
  for (let x = 1; x <= 52; x++) { cv.set(x, 1, '#4A4060'); cv.set(x, 20, '#17121F') }
  for (let y = 1; y <= 20; y++) { cv.set(1, y, '#4A4060'); cv.set(52, y, '#17121F') }
  for (const [x0, y0, x1, y1] of [[3, 3, 50, 18]]) {
    for (let x = x0; x <= x1; x++) { cv.set(x, y0, MAT.trim.b); cv.set(x, y1, MAT.trim.s) }
    for (let y = y0; y <= y1; y++) { cv.set(x0, y, MAT.trim.b); cv.set(x1, y, MAT.trim.s) }
  }
  drawText(cv, 27 - Math.floor(textW('mortem') / 2), 6, 'mortem', MAT.trim.h)
  drawText(cv, 27 - Math.floor(textW('labs') / 2), 12, 'labs', '#C9A6F0')
  outline(cv, mat, '#0C0912')
  saveOffice('doormat', cv, { feet: 21, ax: 1 }, 'Doormat (MORTEM LABS)')
}
export function plantSmall() {
  const cv = new Canvas(26, 34)
  castShadow(cv, 8, 18, 30, { depth: 2, shift: 3 })
  drawPotPlant(cv, 13, 30, 1)
  saveOffice('plant_small', cv, { feet: 30, ax: 8 }, 'Small potted plant')
}
export function plantTall() {
  const cv = new Canvas(36, 62)
  castShadow(cv, 9, 25, 57, { depth: 3, shift: 3 })
  const cx = 17
  // trunk and leaf clusters
  seg(cv, [[cx, 48], [cx, 30]], MAT.woodDark.b)
  seg(cv, [[cx + 1, 48], [cx + 1, 30]], MAT.woodDark.s)
  seg(cv, [[cx - 1, 48], [cx - 1, 34]], MAT.woodDark.l)
  const blobs = [[cx - 8, 38, 7, 8, 1], [cx + 8, 36, 7, 8, 0], [cx - 4, 24, 8, 9, 0], [cx + 6, 22, 7, 9, 1], [cx, 11, 8, 9, 0]]
  for (const [x, y, rx, ry, d] of blobs) drawLeafBlob(cv, x, y, rx, ry, d ? MAT.leafDark : MAT.leaf)
  const pot = P(cv, [[cx - 9, 46], [cx + 9, 46], [cx + 6, 57], [cx - 6, 57]])
  fill(cv, pot, MAT.pot.b)
  for (const [x, y] of pot.cells()) {
    if (y <= 47) cv.set(x, y, MAT.pot.h)
    else if (!pot.has(x - 2, y)) cv.set(x, y, MAT.pot.l)
    else if (!pot.has(x + 2, y) || y >= 56) cv.set(x, y, MAT.pot.s)
  }
  outline(cv, pot, MAT.pot.o)
  for (let x = cx - 8; x <= cx + 8; x++) cv.set(x, 49, MAT.pot.s)
  saveOffice('plant_tall', cv, { feet: 57, ax: 8 }, 'Tall potted plant')
}
