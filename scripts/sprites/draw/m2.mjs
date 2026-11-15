import { Canvas, Mask, ellipse, rect, rrect, poly, stroke, fill, fillRect, line, px, outline, solid, volume, box3d, floorShadow, gloss, dots, save } from './lib.mjs'

const GROUND = '#07080C'
const P = { h: 'h', l: 'l', b: 'b', s: 's', r: 'r', o: 'o' }
const PAL = {
  h: '#FFDDA6', l: '#F9A455', b: '#EE7B38', s: '#A8431E', r: '#C95E2C', o: '#3E1409',
  a: '#FFE9A8', e: '#FFD23F', w: '#FFFBE0', k: '#2A0E08', m: '#E8D8C0', g: GROUND,
}

// A 3D armour plate: lit top surface plus a front wall (height hw) below it. Returns the union mask.
function plate(cv, top, hw, o = {}) {
  const W = cv.w, H = cv.h
  let wall = new Mask(W, H)
  for (let k = 1; k <= hw; k++) wall = wall.or(top.shift(0, k))
  wall = wall.minus(top)
  const all = top.or(wall)
  for (const [x, y] of wall.cells()) {
    const dep = (y - top.bounds().y0) // darker toward the floor
    px(cv, x, y, !wall.has(x, y + 1) && hw > 1 ? 's' : 'b')
  }
  // wall: left part lit, right part in shadow
  const bd = top.bounds()
  for (const [x, y] of wall.cells()) {
    const t = (x - bd.x0) / Math.max(1, bd.x1 - bd.x0)
    if (t > 0.62) px(cv, x, y, 's')
    else if (t < 0.18 && y < top.bounds().y1 + hw - 1) px(cv, x, y, 'l')
  }
  volume(cv, top, P, { rad: o.rad ?? 3.5 })
  outline(cv, all, 'o')
  return { all, wall }
}

// ---------------------------------------------------------------- infinite-crawler
export function infiniteCrawler() {
  const W = 48, H = 48
  const cv = new Canvas(W, H)
  const cx = 24, cy = 21, Rx = 17.5, Ry = 10.5, N = 12
  const deg = Math.PI / 180
  // ring-shaped floor shadow, offset down-right
  const sh = ellipse(W, H, cx + 2, cy + 6, Rx + 6.5, Ry + 6).minus(ellipse(W, H, cx + 2, cy + 6, Rx - 7, Ry - 3))
  fill(cv, sh, 'g')

  const plates = []
  for (let i = 0; i < N; i++) {
    const phi = (74 - (i / (N - 1)) * 322) * deg
    const x = cx + Rx * Math.cos(phi), y = cy + Ry * Math.sin(phi)
    let tx = -Rx * Math.sin(phi), ty = Ry * Math.cos(phi) // direction of travel (decreasing phi)
    const tl = Math.hypot(tx, ty); tx = -tx / tl; ty = -ty / tl
    let nx = Ry * Math.cos(phi), ny = Rx * Math.sin(phi)
    const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl
    const sc = 0.6 + 0.4 * (i / (N - 1))
    plates.push({ x, y, tx, ty, nx, ny, a: 4.3 * sc, b: 3.8 * sc, hw: Math.max(2, Math.round(4 * sc)), i })
  }
  // hooked legs on the outer and inner side
  for (const p of plates) for (const sg of [1, -1]) {
    const q = (d, t = 0) => [p.x + sg * p.nx * d + p.tx * t, p.y + p.hw * 0.4 + sg * p.ny * d + p.ty * t]
    const [x0, y0] = q(p.b - 0.5), [x1, y1] = q(p.b + 1.6), [x2, y2] = q(p.b + 1.8, 1.4)
    line(cv, [[x0, y0], [x1, y1], [x2, y2]], 'o')
  }
  const order = [...plates].sort((a, b) => a.y - b.y)
  for (const p of order) {
    const top = Mask.from(W, H, (x, y) => {
      const dx = x - p.x, dy = y - p.y
      const u = Math.abs(dx * p.tx + dy * p.ty), v = Math.abs(dx * p.nx + dy * p.ny)
      return u <= p.a && v <= p.b && u / p.a + v / p.b <= 1.6
    })
    plate(cv, top, p.hw, { rad: 2.6 })
    // seam across the plate and rivets
    for (const [x, y] of top.cells()) {
      const u = (x + 0.5 - p.x) * p.tx + (y + 0.5 - p.y) * p.ty
      if (Math.abs(u) < 0.55) px(cv, x, y, 'o')
    }
  }
  // head in front, facing the camera, mandibles reaching for the tail tip
  const hx = 16, hy = 30
  const top = ellipse(W, H, hx, hy, 7.6, 5.6)
  plate(cv, top, 5, { rad: 5 })
  gloss(cv, hx - 4, hy - 4, 2, 1, 'h')
  // glowing eyes on the front wall + angry brow ridge
  for (const ex of [hx - 4, hx + 1.5]) { fillRect(cv, ex, hy + 1, ex + 2, hy + 2, 'e'); px(cv, ex + 1, hy + 1, 'w'); px(cv, ex, hy + 3, 'o'); px(cv, ex + 1, hy + 3, 'o'); px(cv, ex + 2, hy + 3, 'o') }
  line(cv, [[hx - 5, hy - 0.5], [hx - 1, hy + 0.5]], 'o'); line(cv, [[hx + 6, hy - 0.5], [hx + 2, hy + 0.5]], 'o')
  // mandibles curve out and in towards the tail
  for (const [pts] of [[[[hx + 5, hy + 4], [hx + 9, hy + 5], [hx + 11.5, hy + 3], [hx + 11.5, hy + 0.5]]]]) {
    const m = stroke(W, H, pts, 2)
    solid(cv, m, P, { rad: 1.5 })
    dots(cv, [[hx + 12, hy + 0.5]], 'm')
  }
  // antennae with glowing tips
  for (const pts of [[[hx - 4, hy - 5], [hx - 5, hy - 8], [hx - 3, hy - 11]], [[hx + 3, hy - 5.5], [hx + 4, hy - 8], [hx + 7, hy - 9.5]]]) {
    line(cv, pts, 'o'); const [tx, ty] = pts[pts.length - 1]; px(cv, tx, ty, 'e'); px(cv, tx + 1, ty, 'a')
  }
  save('infinite-crawler', cv, PAL, 'Infinite Crawler - retry.js')
}

// ---------------------------------------------------------------- crawler-head (24x24)
export function crawlerHead() {
  const W = 24, H = 24
  const cv = new Canvas(W, H)
  floorShadow(cv, 13.5, 21.2, 9.5, 1.9, 'g', { dashes: false })
  // antennae with glowing tips
  for (const flip of [false, true]) {
    const X = (x) => (flip ? 23 - x : x)
    line(cv, [[X(8), 5], [X(6), 3], [X(7), 1.5]], 'o')
    px(cv, X(7), 0, 'e'); px(cv, X(7), 1, 'a')
  }
  // cheek plates
  for (const flip of [false, true]) {
    const X = (x) => (flip ? 23 - x : x)
    const c = ellipse(W, H, flip ? 21.5 : 2.5, 11, 2.2, 3)
    solid(cv, c, P, { rad: 2 })
  }
  const top = ellipse(W, H, 12, 8.8, 8.6, 5.4)
  const { all } = plate(cv, top, 7, { rad: 5 })
  gloss(cv, 7, 5, 2, 1, 'h')
  // brow ridge, eyes, nasal plate
  for (const flip of [false, true]) {
    const X = (x) => (flip ? 23 - x : x)
    const ex = flip ? 14 : 6
    fillRect(cv, ex, 12, ex + 3, 14, 'o'); fillRect(cv, ex + (flip ? 0 : 1), 12, ex + (flip ? 2 : 3), 13, 'e')
    px(cv, flip ? 15 : 8, 12, 'w')
    line(cv, [[X(4), 10], [X(10), 12]], 'o')
  }
  // mandibles over the lower wall
  for (const flip of [false, true]) {
    const X = (x) => (flip ? 23 - x : x)
    const m = stroke(W, H, [[X(7), 16], [X(6), 19], [X(8), 21], [X(11), 20]], 2)
    solid(cv, m, P, { rad: 1.5 })
  }
  fillRect(cv, 10, 17, 13, 18, 'k')
  for (const x of [11, 12]) px(cv, x, 4, 'l')
  save('crawler-head', cv, PAL, 'Crawler head')
}

// ---------------------------------------------------------------- crawler-segment (24x24)
export function crawlerSegment() {
  const W = 24, H = 24
  const cv = new Canvas(W, H)
  floorShadow(cv, 13, 21.2, 10, 1.8, 'g', { dashes: false })
  // hooked legs front and back
  for (const x of [5, 9, 13, 17]) {
    line(cv, [[x, 6], [x, 3], [x + 2, 2]], 'o')
    line(cv, [[x, 18], [x, 20], [x + 2, 21]], 'o')
  }
  const top = rrect(W, H, 2, 6, 20, 14, 3)
  plate(cv, top, 4, { rad: 4 })
  // raised inner panel, seam and rivets
  for (let x = 6; x <= 16; x++) { if (cv.get(x, 8) !== 'o') px(cv, x, 8, 'h') }
  for (let y = 8; y <= 12; y++) { px(cv, 11, y, 'o'); px(cv, 10, y, 'h') }
  for (const [x, y] of [[4, 8], [18, 8], [4, 12], [18, 12]]) { px(cv, x, y, 'o') }
  for (const [x, y] of [[7, 11], [8, 10], [14, 11]]) px(cv, x, y, 'r')
  for (const [x, y] of [[4, 9], [5, 8]]) px(cv, x, y, 'a')
  // wall detail: lower seam
  for (let x = 3; x <= 19; x += 2) px(cv, x, 17, 'o')
  save('crawler-segment', cv, PAL, 'Crawler segment')
}
