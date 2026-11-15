import { Canvas, Mask, ellipse, rect, rrect, poly, stroke, fill, fillRect, line, px, outline, solid, volume, box3d, floorShadow, gloss, dots, flipX, dilate, save } from './lib.mjs'

const GROUND = '#07080C'

// ---------------------------------------------------------------- twins 32x32
const TP = { h: 'h', l: 'l', b: 'b', s: 's', r: 'r', o: 'o' }
const TWIN_PAL = {
  h: '#D6EEFF', l: '#86C4FB', b: '#4FA3F7', s: '#2A5DB4', r: '#3A7ACE', o: '#0E2452',
  k: '#09122B', w: '#FFFFFF', e: '#BFE9FF', y: '#FFF2A8', g: GROUND,
}
function drawTwin(cv) {
  const W = cv.w, H = cv.h
  // pointed ears behind the head
  for (const flip of [false, true]) {
    const X = (x) => (flip ? 28 - x : x)
    const ear = poly(W, H, [[X(6), 19], [X(0.5), 9], [X(9), 12.5]])
    solid(cv, ear, TP, { rad: 2 })
    dots(cv, [[X(5), 14], [X(4), 12]], 's')
  }
  // body/head blob
  solid(cv, ellipse(W, H, 14, 19, 10, 8.8), TP, { rad: 7 })
  gloss(cv, 8, 13, 3, 1, 'h'); px(cv, 7, 14, 'h')
  // stubby hands and feet in front
  for (const [x, y, rx, ry] of [[3.5, 22.5, 2.2, 2.6], [24.5, 22.5, 2.2, 2.6], [9, 27.6, 3.6, 2.2], [19, 27.6, 3.6, 2.2]]) solid(cv, ellipse(W, H, x, y, rx, ry), TP, { rad: 2 })
  // half-lidded sly eyes
  for (const ex of [10.5, 17.5]) {
    const e = ellipse(W, H, ex, 15.8, 2.7, 2.7)
    for (const [x, y] of e.cells()) px(cv, x, y, y < 15 ? 'b' : 'w')
    fillRect(cv, ex + 0, 15, ex + 1, 17, 'k'); px(cv, ex, 15, 'w')
    for (let x = Math.floor(ex - 3); x <= Math.floor(ex + 2); x++) px(cv, x, 14, 'o')
  }
  // sly grin with teeth
  line(cv, [[7, 19], [8, 20], [9, 21], [11, 22], [14, 22], [17, 22], [19, 21], [20, 20], [21, 19]], 'o')
  fillRect(cv, 11, 23, 17, 23, 'k'); fillRect(cv, 9, 22, 10, 22, 'k'); fillRect(cv, 18, 22, 19, 22, 'k')
  dots(cv, [[11, 23], [12, 23], [14, 23], [16, 23], [17, 23]], 'w')
  dots(cv, [[6, 17], [22, 17]], 's')
  // antennae shaped like clear zig-zag lightning bolts ending in bright tips
  for (const flip of [false, true]) {
    const X = (x) => (flip ? 28 - x : x)
    const pts = [[11, 10], [8, 8], [11, 7], [8, 4], [10, 3]].map(([x, y]) => [X(x), y])
    const m = stroke(W, H, pts, 1)
    outline(cv, m, 'o'); fill(cv, m, 'y')
    fillRect(cv, X(10) - (flip ? 1 : 0), 0, X(10) + (flip ? 0 : 1), 1, 'w')
    outline(cv, Mask.from(W, H, (x, y) => x >= Math.min(X(10), X(10) + (flip ? -1 : 1)) && x <= Math.max(X(10), X(10) + (flip ? -1 : 1)) && y <= 1 && y >= 0), 'o')
  }
}
function twinMask() {
  const t = new Canvas(32, 32)
  drawTwin(t)
  return Mask.from(32, 32, (x, y) => t.get(Math.floor(x), Math.floor(y)) !== '.')
}
export function twinA() {
  const cv = new Canvas(32, 32)
  floorShadow(cv, 16.5, 30, 11, 1.8, 'g', { dashes: false })
  drawTwin(cv)
  save('twin-a', cv, TWIN_PAL, 'Twin A - inventory.js')
}
export function twinB() {
  const cv = new Canvas(32, 32)
  floorShadow(cv, 16.5, 30, 11, 1.8, 'g', { dashes: false })
  const ghost = twinMask().shift(2, 0)
  fill(cv, ghost, 'j'); outline(cv, ghost, 'J')
  drawTwin(cv)
  save('twin-b', cv, { ...TWIN_PAL, j: '#1B3F8C', J: '#102763' }, 'Twin B - inventory.js')
}

// ---------------------------------------------------------------- deadlock golem 40x56
const SP = { h: 'h', l: 'l', b: 'b', s: 's', r: 'r', o: 'o' }
const GOLEM_PAL = {
  h: '#F0F4FF', l: '#C6D0E6', b: '#9AA6BF', s: '#5E6A88', r: '#7A87A6', o: '#1B2133',
  u: '#7B5A47', R: '#FF5A47', d: '#9E2A2E', Q: '#FFD6BE', k: '#0B0E19', g: GROUND,
}
function golem(name, flip) {
  const W = 40, H = 56
  const cv = new Canvas(W, H)
  const X = (x) => (flip ? W - 1 - x : x)
  const M = (m) => (flip ? flipX(m) : m)
  const P = (x, y, c) => px(cv, X(x), y, c)
  const S = (m, o = {}) => solid(cv, M(m), SP, o)
  const sd = flip ? -1 : 1
  const rivet = (x, y) => { P(x, y, 'h'); P(x + 1, y + 1, 's') }
  const crack = (pts) => { for (const [x, y] of pts) P(x, y, 'o') }

  floorShadow(cv, flip ? 17 : 23, 53.2, 17, 2.8, 'g', { dashes: false })
  // legs and feet
  S(rrect(W, H, 11, 38, 18, 49, 2), { rad: 4 }); S(rrect(W, H, 22, 38, 29, 49, 2), { rad: 4 })
  S(rrect(W, H, 9, 48, 19, 52, 2), { rad: 3 }); S(rrect(W, H, 21, 48, 31, 52, 2), { rad: 3 })
  rivet(13, 42); rivet(25, 42); crack([[15, 44], [16, 45], [15, 46]])
  // torso
  S(poly(W, H, [[9, 21], [31, 21], [30, 38], [27, 44], [13, 44], [10, 38]]), { rad: 8 })
  for (let x = 12; x <= 28; x += 4) P(x, 43, 'o')
  rivet(12, 24); rivet(26, 24); rivet(11, 39); rivet(28, 39)
  crack([[27, 30], [28, 31], [27, 32], [28, 33], [28, 34], [29, 35]]); crack([[11, 29], [12, 30], [11, 31]])
  for (const [x, y] of [[26, 35], [27, 36], [12, 34]]) P(x, y, 'u')
  // padlock-shaped chest plate with a glowing keyhole
  const shackle = ellipse(W, H, 20, 32, 5.6, 6).minus(ellipse(W, H, 20, 32, 3.4, 4)).minus(rect(W, H, 10, 31.5, 30, 40))
  S(shackle, { rad: 2, hi: false })
  S(rrect(W, H, 14, 31, 26, 41, 2), { rad: 5, bias: 0.08 })
  fill(cv, M(ellipse(W, H, 20, 35.2, 3.3, 3.3)), 'd'); fill(cv, M(rect(W, H, 18, 36, 21, 40)), 'd')
  fill(cv, M(ellipse(W, H, 20, 35.2, 2.1, 2.1)), 'R'); fill(cv, M(rect(W, H, 19, 36, 20, 39)), 'R'); P(19, 34, 'Q')
  // head: sunk between the shoulders, heavy brow, red slit eyes
  S(rrect(W, H, 13, 10, 27, 24, 3), { rad: 6 })
  S(rect(W, H, 12, 14, 28, 17), { rad: 2, bias: -0.05 })
  for (let x = 13; x <= 27; x++) P(x, 17, 'o')
  for (const [a, b] of [[14, 17], [23, 26]]) {
    for (let x = a; x <= b - 1; x++) { P(x, 19, 'R') }
    for (let x = a - 1; x <= b; x++) { P(x, 18, 'd'); P(x, 20, 'd') }
    P(a + 1, 19, 'Q')
  }
  for (const x of [17, 20, 23]) for (let y = 22; y <= 23; y++) P(x, y, 'o')
  rivet(14, 12); P(26, 12, 'h')
  // shoulder pauldrons
  S(ellipse(W, H, 7.5, 23, 6.8, 6), { rad: 5 }); S(ellipse(W, H, 32.5, 23, 6.8, 6), { rad: 5 })
  rivet(5, 20); rivet(31, 20); crack([[8, 25], [9, 26], [8, 27]]); crack([[35, 24], [34, 25], [35, 26]])
  P(10, 20, 'l'); P(11, 20, 'l')
  // far (unarmed) arm with a huge fist
  S(rrect(W, H, 31, 27, 37, 39, 2), { rad: 3 })
  S(rrect(W, H, 28, 37, 39, 49, 3), { rad: 5 })
  for (const x of [31, 34, 37]) { P(x, 44, 'o'); P(x, 45, 'o') }
  rivet(30, 39); crack([[36, 41], [37, 42], [36, 43]]); P(33, 47, 'u'); P(34, 47, 'u')
  // padlock arm: forearm, fist, hanging padlock with a clear shackle
  S(rrect(W, H, 2, 24, 8, 31, 2), { rad: 3 })
  const ring = ellipse(W, H, 6.5, 43.5, 6.3, 9.5).minus(ellipse(W, H, 6.5, 43.5, 3.2, 6.8)).minus(rect(W, H, 0, 45, 14, 56))
  solid(cv, M(ring), { h: 'h', l: 'l', b: 'b', s: 'r', o: 'o' }, { rad: 3 })
  S(rrect(W, H, 0, 28, 11, 36, 3), { rad: 4 })
  for (const x of [3, 6, 9]) { P(x, 32, 'o'); P(x, 33, 'o') }
  // padlock body as a 3-face box (mirrored by hand for flip)
  if (!flip) {
    box3d(cv, 0, 45, 12, 55, 2, 2, SP)
    fillRect(cv, 5, 49, 7, 51, 'k'); P(6, 52, 'k'); P(6, 53, 'k')
  } else {
    const t = new Canvas(W, H)
    box3d(t, 0, 45, 12, 55, 2, 2, SP)
    fillRect(t, 5, 49, 7, 51, 'k'); px(t, 6, 52, 'k'); px(t, 6, 53, 'k')
    // mirror, then re-light: top and the lit edge go to the left again
    const lit = new Canvas(W, H)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (t.get(x, y) !== '.') lit.set(W - 1 - x, y, t.get(x, y))
    const m = Mask.from(W, H, (x, y) => lit.get(Math.floor(x), Math.floor(y)) !== '.')
    for (const [x, y] of m.cells()) cv.set(x, y, lit.get(x, y))
    volume(cv, M(rect(W, H, 0, 45, 12, 55)).shift(0, 0), SP, { rad: 4 })
    outline(cv, m, 'o')
    fillRect(cv, Math.min(X(5), X(7)), 49, Math.max(X(5), X(7)), 51, 'k'); P(6, 52, 'k'); P(6, 53, 'k')
  }
  rivet(2, 47)
  save(name, cv, GOLEM_PAL, `Deadlock ${flip ? 'B' : 'A'} - transfer.js`)
}
export function deadlockA() { golem('deadlock-a', false) }
export function deadlockB() { golem('deadlock-b', true) }

// ---------------------------------------------------------------- legacy 64x64
export function legacy() {
  const W = 64, H = 64
  const cv = new Canvas(W, H)
  const BP = { h: 'h', l: 'l', b: 'b', s: 's', r: 'r', o: 'o' }
  const FP = { h: 'h', l: 'c', b: 'C', s: 'o', o: 'o' }
  const RED = { h: 'R', l: 'R', b: 'R', s: 'D', o: 'o' }
  const GRY = { h: 'c', l: 'c', b: 'c', s: 'C', o: 'o' }
  floorShadow(cv, 34, 57, 29.5, 4.5, 'g', { dashes: false })

  // a CRT: 3-face beige box + recessed dark screen + scanlines
  const crt = (x0, y0, x1, y1, dx, dy, o = {}) => {
    box3d(cv, x0, y0, x1, y1, dx, dy, BP, { ao: false })
    const sx0 = x0 + 3, sy0 = y0 + 3, sx1 = x1 - 3, sy1 = y1 - (o.chin ?? 6)
    fillRect(cv, sx0 - 1, sy0 - 1, sx1 + 1, sy1 + 1, 'o')
    fillRect(cv, sx0, sy0, sx1, sy1, 'k')
    for (let y = sy0; y <= sy1; y += 2) for (let x = sx0; x <= sx1; x++) px(cv, x, y, 'z')
    for (let x = sx0 - 1; x <= sx1 + 1; x++) px(cv, x, sy1 + 2, 'h')
    for (let y = sy0 - 1; y <= sy1 + 2; y++) px(cv, sx1 + 2, y, 'h')
    // glass glint top-left
    px(cv, sx0, sy0 + 1, 'f'); px(cv, sx0 + 1, sy0 + 1, 'f'); px(cv, sx0, sy0 + 2, 'f')
    // vents on the top face and controls on the chin
    for (let x = x0 + 3; x < x1 - 2; x += 3) px(cv, x + Math.floor(dx / 2), y0 - Math.ceil(dy / 2), 's')
    for (const x of [x1 - 8, x1 - 5]) { px(cv, x, y1 - 2, 'o'); px(cv, x + 1, y1 - 2, 'o') }
    px(cv, x0 + 3, y1 - 2, 'R')
    return { sx0, sy0, sx1, sy1 }
  }

  // back-right monitor showing static
  const C = crt(40, 4, 59, 22, 4, 3)
  let seed = 7
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }
  for (let y = C.sy0; y <= C.sy1; y++) for (let x = C.sx0 + 1; x <= C.sx1; x++) if (rnd() < 0.2) px(cv, x, y, rnd() < 0.5 ? 'f' : 'c')
  // back-left monitor with a cracked screen
  const B = crt(3, 12, 25, 34, 5, 4)
  line(cv, [[12, B.sy0], [11, B.sy0 + 3], [13, B.sy0 + 5], [11, B.sy0 + 8], [14, B.sy0 + 10], [13, B.sy1]], 'h')
  line(cv, [[11, B.sy0 + 3], [8, B.sy0 + 5], [7, B.sy0 + 8]], 'h')
  line(cv, [[13, B.sy0 + 5], [16, B.sy0 + 4], [19, B.sy0 + 6]], 'h')
  // lower-left monitor, tilted heap base
  crt(2, 36, 17, 51, 4, 3, { chin: 5 })
  // main monitor with the grumpy face
  const M = crt(15, 24, 44, 49, 7, 6, { chin: 7 })
  for (let y = M.sy0 + 2; y <= M.sy1; y++) for (let x = M.sx0; x <= M.sx1; x++) if (cv.get(x, y) === 'z' && (y - M.sy0) % 2 === 0) { /* keep scanlines */ }
  // face (pale phosphor): thick angry brows, square eyes, frown
  const FC = 'f'
  line(cv, [[M.sx0 + 2, M.sy0 + 3], [M.sx0 + 4, M.sy0 + 4], [M.sx0 + 7, M.sy0 + 5]], FC)
  line(cv, [[M.sx0 + 2, M.sy0 + 4], [M.sx0 + 4, M.sy0 + 5], [M.sx0 + 7, M.sy0 + 6]], FC)
  line(cv, [[M.sx1 - 2, M.sy0 + 3], [M.sx1 - 4, M.sy0 + 4], [M.sx1 - 7, M.sy0 + 5]], FC)
  line(cv, [[M.sx1 - 2, M.sy0 + 4], [M.sx1 - 4, M.sy0 + 5], [M.sx1 - 7, M.sy0 + 6]], FC)
  fillRect(cv, M.sx0 + 3, M.sy0 + 7, M.sx0 + 7, M.sy0 + 10, FC); fillRect(cv, M.sx0 + 5, M.sy0 + 8, M.sx0 + 6, M.sy0 + 10, 'k')
  fillRect(cv, M.sx1 - 7, M.sy0 + 7, M.sx1 - 3, M.sy0 + 10, FC); fillRect(cv, M.sx1 - 6, M.sy0 + 8, M.sx1 - 5, M.sy0 + 10, 'k')
  line(cv, [[M.sx0 + 5, M.sy1 - 1], [M.sx0 + 7, M.sy1 - 3], [M.sx1 - 7, M.sy1 - 3], [M.sx1 - 5, M.sy1 - 1]], FC)
  px(cv, 32, M.sy0 + 10, FC); px(cv, 32, M.sy0 + 11, FC)

  // sticky note on the lower-left monitor
  const note = rect(W, H, 4, 41, 14, 50)
  fill(cv, note, 'y'); outline(cv, note, 'o')
  for (const [y, w] of [[43, 7], [45, 6], [47, 7]]) for (let x = 6; x < 6 + w; x++) px(cv, x, y, 'Y')
  for (let x = 4; x <= 14; x++) px(cv, x, 50, 'Y')
  dots(cv, [[14, 50], [13, 50], [14, 49]], 'Y'); px(cv, 4, 41, 'h')
  // floppy disk, leaning on the heap
  box3d(cv, 46, 41, 58, 53, 2, 2, FP, { ao: false })
  fillRect(cv, 49, 41, 55, 45, 'c'); fillRect(cv, 53, 42, 54, 44, 'k')
  fillRect(cv, 48, 48, 56, 52, 'h'); for (const y of [49, 51]) for (let x = 49; x <= 54; x++) px(cv, x, y, 'c')
  px(cv, 47, 42, 'c')
  // rust and dust on the beige plastic
  for (const [x, y] of [[17, 47], [18, 46], [41, 46], [42, 47], [23, 26], [3, 33], [8, 49], [58, 20]]) if (['b', 'l', 's'].includes(cv.get(x, y))) px(cv, x, y, 'D')
  for (const [x, y] of [[20, 25], [30, 25], [36, 25], [47, 8], [6, 13]]) if (cv.get(x, y) === 'l') px(cv, x, y, 'b')

  // tangled cables in front
  const cable = (pts, P) => { const m = stroke(W, H, pts, 2); solid(cv, m, P, { rad: 2 }) }
  cable([[2, 54], [9, 58], [15, 61], [23, 57], [29, 60], [44, 62], [56, 60]], GRY)
  cable([[4, 58], [11, 52], [19, 55], [26, 60], [35, 56], [42, 60], [50, 58], [60, 55]], RED)
  // plug at the end
  box3d(cv, 55, 52, 60, 56, 2, 1, GRY, { ao: false })
  px(cv, 61, 54, 'k')
  save('legacy', cv, {
    h: '#FBF3DA', l: '#EBDDB6', b: '#D2BE92', s: '#9C8460', r: '#B49E74', o: '#33261A',
    k: '#0F1A18', z: '#1A2F2B', f: '#A6E8B8', R: '#D63A30', D: '#7E1C1C',
    c: '#8E96A8', C: '#4C5263', y: '#F5DE5B', Y: '#C4A52C', g: GROUND,
  }, 'Legacy - billing.js + invoice.js + utils.js')
}
