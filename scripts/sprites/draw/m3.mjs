import { Canvas, Mask, ellipse, rect, rrect, poly, stroke, fill, fillRect, line, px, outline, solid, volume, box3d, floorShadow, gloss, dots, flipX, save } from './lib.mjs'

const GROUND = '#07080C'

// ---------------------------------------------------------------- async-phantom 32x56
export function asyncPhantom() {
  const W = 32, H = 56
  const cv = new Canvas(W, H)
  const RB = { h: 'h', l: 'l', b: 'b', s: 's', o: 'o' }
  const HD = { h: 'H', l: 'L', b: 'B', s: 'S', o: 'o' }
  floorShadow(cv, 18, 53.2, 10, 2, 'g', { dashes: false })

  // spinner dots behind the head (back half)
  const ring = []
  for (let i = 0; i < 8; i++) {
    const a = (-90 + i * 45) * (Math.PI / 180)
    ring.push({ x: Math.round(16 + 14 * Math.cos(a)), y: Math.round(10.5 + 9.2 * Math.sin(a)), lv: ['e', 'e', 'a', 'a', 'd', 'd', 'd', 'd'][i], back: Math.sin(a) < -0.2 })
  }
  const spin = (p) => { for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) px(cv, p.x + dx, p.y + dy, p.lv) }
  
  // narrow robe with a ragged, broken hem
  let robe = poly(W, H, [[11.5, 15], [20.5, 15], [22, 24], [22.5, 36], [24, 43], [8, 43], [9.5, 36], [10, 24]])
  const hem = [1, 4, 3, 7, 5, 9, 4, 2, 6, 10, 5, 3, 8, 4, 1, 3]
  for (let i = 0; i < 16; i++) for (let y = 43; y < 43 + hem[i]; y++) robe.add(8 + i, y)
  // broken-off flakes drift below the hem
  for (const [x, y] of [[10, 52], [11, 52], [11, 51], [20, 51], [21, 51], [21, 52], [16, 53]]) robe.add(x, y)
  solid(cv, robe, RB, { rad: 5 })
  // vertical folds
  for (const [x, y0, y1] of [[14, 25, 46], [19, 27, 44], [11, 38, 46]]) for (let y = y0; y <= y1; y++) if (robe.has(x, y) && cv.get(x, y) === 'b') px(cv, x, y, 's')
  for (const [x, y0, y1] of [[13, 30, 40], [12, 28, 34]]) for (let y = y0; y <= y1; y++) if (cv.get(x, y) === 'b') px(cv, x, y, 'l')

  // arms hanging to the knees with long fingers; far arm first, near arm over the body
  for (const flip of [false, true]) {
    const mk = (x0, y0, x1, y1) => (flip ? rect(W, H, 31 - x1, y0, 31 - x0, y1) : rect(W, H, x0, y0, x1, y1))
    let arm = mk(8, 17, 10, 27).or(mk(7, 27, 9, 37)).or(mk(7, 36, 10, 40))
    const fingers = new Mask(W, H)
    for (const [fx, len] of [[7, 5], [9, 7], [10, 4]]) for (let y = 41; y < 41 + len; y++) fingers.add(flip ? 31 - fx : fx, y)
    solid(cv, arm.or(fingers), RB, { rad: 2, hi: false, bias: -0.12 })
    for (const [x, y] of fingers.cells()) if (cv.get(x, y) !== 'o') px(cv, x, y, y > 43 ? 's' : 'l')
  }

  // pointed hood with a dark face void and two small glowing eyes
  const hood = ellipse(W, H, 16, 10.5, 6.6, 7.4).or(poly(W, H, [[10.5, 8], [16, 0.5], [21.5, 8]]))
  solid(cv, hood, HD, { rad: 6 })
  const face = ellipse(W, H, 16.5, 11.5, 4.1, 5)
  fill(cv, face, 'k')
  outline(cv, face, 'o')
  for (const [x, y] of face.cells()) if (!face.has(x - 1, y) && cv.get(x, y) === 'k') px(cv, x, y, 'o')
  for (const flip of [false, true]) {
    const X = (x) => (flip ? 33 - x : x)
    dots(cv, [[X(13), 11], [X(14), 11], [X(14), 12]], 'e'); px(cv, X(13), 10, 'a')
  }
  // front half of the spinner
  ring.forEach(spin)
  save('async-phantom', cv, {
    h: '#D9CBFF', l: '#9784E8', b: '#6A55BC', s: '#42327F', o: '#140F30',
    H: '#7766CC', L: '#4F3F9A', B: '#33276F', S: '#211A47',
    k: '#07050F', e: '#F1EAFF', a: '#9C7CF2', d: '#5D4BA8', g: GROUND,
  }, 'Async Phantom - payment.js')
}

// ---------------------------------------------------------------- phantom-shadow 40x14
export function phantomShadow() {
  const W = 40, H = 14
  const cv = new Canvas(W, H)
  let m = ellipse(W, H, 7, 7, 6.2, 5.2).or(poly(W, H, [[2, 7], [7, 1.5], [10, 3]]))
  m = m.or(poly(W, H, [[10, 3.5], [30, 4.5], [31, 9.5], [10, 10.5]]))
  const tail = [4, 6, 5, 8, 8, 6, 3, 5, 2]
  for (let i = 0; i < tail.length; i++) {
    const x = 30 + i
    for (let y = 7 - Math.floor(tail[i] / 2); y < 7 + Math.ceil(tail[i] / 2); y++) m.add(x, y)
  }
  const arms = stroke(W, H, [[12, 2], [26, 2]]).or(stroke(W, H, [[12, 11], [26, 11]]))
  for (const [x, y] of [[27, 1], [27, 3], [28, 2], [27, 10], [27, 12], [28, 11]]) arms.add(x, y)
  m = m.or(arms)
  fill(cv, m, 'f'); outline(cv, m, 'o')
  for (const [x, y] of m.cells()) if (!m.has(x + 1, y + 1) && y > 8 && cv.get(x, y) === 'f') px(cv, x, y, 't')
  for (const [x, y] of m.cells()) if (!m.has(x - 1, y) || !m.has(x, y - 1)) if (cv.get(x, y) === 'f' && y < 6) px(cv, x, y, 'u')
  fill(cv, ellipse(W, H, 7, 7, 2.6, 3.2), 'k')
  px(cv, 6, 5, 'e'); px(cv, 6, 8, 'e')
  save('phantom-shadow', cv, { f: '#7C62D8', t: '#5842AE', u: '#A28BF0', o: '#1A1240', k: '#0A0716', e: '#F3EEFF' }, 'Phantom shadow')
}

// ---------------------------------------------------------------- memory-leech 48x40
export function memoryLeech() {
  const W = 48, H = 40
  const cv = new Canvas(W, H)
  const B = { h: 'h', l: 'l', b: 'b', s: 's', o: 'o' }
  const G = { h: 'a', l: 'q', b: 'G', s: 'A', o: 'O' }
  floorShadow(cv, 28, 37, 19.5, 2.6, 'g')

  // body segments, back to front: the overlapping outlines make the ribs
  const segs = [[41, 27, 4.6, 5.4], [34.5, 25, 6.2, 7.6], [27, 25, 7, 9], [19.5, 26, 7.6, 10]]
  for (const [cx, cy, rx, ry] of segs) solid(cv, ellipse(W, H, cx, cy, rx, ry), B, { rad: 5 })
  // RAM sticks stuck in the back, pins down
  const stick = (x0, base) => {
    const y1 = base, y0 = base - 9
    box3d(cv, x0, y0, x0 + 4, y1, 2, 2, G, { ao: false })
    fillRect(cv, x0 + 1, y0 + 2, x0 + 2, y0 + 3, 'k'); fillRect(cv, x0 + 1, y0 + 5, x0 + 2, y0 + 6, 'k')
    for (const dx of [0, 2, 4]) px(cv, x0 + dx, y1 - 1, 'y'); for (const dx of [1, 3]) px(cv, x0 + dx, y1, 'y')
  }
  stick(36, 20); stick(29, 17); stick(21, 17)
  // head disc (closest to the camera) with the lamprey mouth
  const head = ellipse(W, H, 11.5, 25, 10, 11)
  solid(cv, head, B, { rad: 6 })
  const mx = 11, my = 28.5, mrx = 6.6, mry = 7
  const mouth = ellipse(W, H, mx, my, mrx, mry)
  fill(cv, mouth, 'k'); outline(cv, mouth, 'o')
  for (const [x, y] of mouth.cells()) if (!mouth.has(x, y - 1) || !mouth.has(x - 1, y)) px(cv, x, y, 's')
  // lamprey ring: two rows of small pale teeth around a dark throat
  for (const [x, y] of mouth.cells()) {
    const dx = (x + 0.5 - mx) / mrx, dy = (y + 0.5 - my) / mry
    const rho = Math.hypot(dx, dy)
    const ai = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 14)
    if (rho > 0.68) px(cv, x, y, ai % 2 ? 'v' : 'w')
    else if (rho > 0.42 && ai % 2 === 0) px(cv, x, y, 'w')
  }
  for (const [x, y] of [[11, 27], [11, 28], [10, 28]]) px(cv, x, y, 'p')
  // beady eyes with angry brows
  for (const [ex, ey] of [[6, 18], [13, 17]]) {
    fillRect(cv, ex, ey, ex + 2, ey + 2, 'w'); px(cv, ex + 1, ey + 1, 'k'); px(cv, ex + 1, ey + 2, 'k')
  }
  line(cv, [[5, 16], [9, 17]], 'o'); line(cv, [[16, 15], [12, 16]], 'o')
  // gloss
  dots(cv, [[8, 13], [9, 12], [11, 12]], 'h')
  // slime drips
  const drip = (x, y0, len) => {
    for (let y = y0; y < y0 + len; y++) px(cv, x, y, 'a')
    fillRect(cv, x - 1, y0 + len, x, y0 + len + 1, 'a'); px(cv, x, y0 + len + 1, 'G'); px(cv, x - 1, y0 + len + 1, 'a')
    px(cv, x + 1, y0 + len, 'O'); px(cv, x + 1, y0 + len + 1, 'O')
  }
  drip(6, 35, 1); drip(16, 36, 1); drip(31, 31, 3); drip(41, 31, 2)
  for (const [x, y] of [[4, 20], [4, 21], [40, 24]]) if (cv.get(x, y) !== '.') px(cv, x, y, 'a')
  save('memory-leech', cv, {
    h: '#E4BCFF', l: '#B87FEE', b: '#8750C8', s: '#552F8E', o: '#1E0E3A',
    a: '#A9F07E', q: '#7ED66A', G: '#47B04A', A: '#2B7433', O: '#10301A',
    w: '#F4EAD2', v: '#B8A98C', k: '#150A24', p: '#5A2A66', y: '#F3C447', g: GROUND,
  }, 'Memory Leech - cache.js')
}

// ---------------------------------------------------------------- leech-trail 24x12
export function leechTrail() {
  const W = 24, H = 12
  const cv = new Canvas(W, H)
  const G = { h: 'a', l: 'q', b: 'G', s: 'A', o: 'O' }
  const m = ellipse(W, H, 12, 6.5, 10, 3.8).or(ellipse(W, H, 5.5, 7.5, 4, 2.6)).or(ellipse(W, H, 19, 5.5, 4, 2.8)).or(ellipse(W, H, 8, 3.4, 3, 1.6))
  solid(cv, m, G, { rad: 3, bias: 0.05 })
  dots(cv, [[6, 5], [7, 4], [8, 4], [9, 4], [16, 5], [17, 5]], 'w')
  dots(cv, [[14, 8], [15, 8], [4, 8], [20, 6]], 's' === 'x' ? 'x' : 'A')
  px(cv, 11, 6, 'a'); px(cv, 12, 6, 'a')
  save('leech-trail', cv, {
    a: '#C8FF9A', q: '#7ED66A', G: '#47B04A', A: '#2B7433', O: '#10301A', w: '#F2FFE0',
  }, 'Leech trail')
}
