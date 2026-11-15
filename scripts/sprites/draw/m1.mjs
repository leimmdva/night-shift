import { Canvas, Mask, ellipse, rect, rrect, poly, stroke, fill, fillRect, line, px, outline, solid, box3d, floorShadow, gloss, dots, save } from './lib.mjs'

const GROUND = '#07080C'

// ---------------------------------------------------------------- null-ghost
export function nullGhost() {
  const W = 48, H = 48
  const cv = new Canvas(W, H)
  const P = { h: 'h', l: 'l', b: 'b', s: 's', r: 'r', o: 'o' }
  floorShadow(cv, 27, 44.5, 18, 2.8, 'g', { dashes: false })

  // sheet body: dome head + flared sheet + elliptical hem (the floor plane) with scalloped notches
  let body = ellipse(W, H, 24, 17, 15, 13.5)
    .or(poly(W, H, [[9.5, 17], [38.5, 17], [41, 38], [7, 38]]))
    .or(ellipse(W, H, 24, 38, 17.5, 5))
  for (const nx of [12, 18.5, 25, 31, 37]) {
    body = body.minus(Mask.from(W, H, (x, y) => y > 37.5 && Math.abs(x - nx) < (y - 37.5) * 0.42))
  }
  const hole = ellipse(W, H, 24, 33.5, 4.6, 5)
  // shade the whole sheet first (so the hole does not create a shadow ring), then punch the hole through it
  solid(cv, body, P, { rad: 9 })
  for (const [x, y] of hole.cells()) px(cv, x, y, '.')
  outline(cv, hole, 'o')
  body = body.minus(hole)

  // inner wall of the hole: the far (upper) wall is visible and in shadow
  for (const [x, y] of hole.cells()) {
    if (!hole.has(x, y - 2) || !hole.has(x - 1, y - 1)) px(cv, x, y, 'o')
  }
  for (const [x, y] of hole.cells()) if (!hole.has(x, y - 3) && cv.get(x, y) === '.') px(cv, x, y, 'k')
  // lit lower lip of the hole
  for (const [x, y] of hole.cells()) if (!hole.has(x, y + 1) && cv.get(x, y) === '.') px(cv, x, y, 'o')

  // cloth folds from the hem notches up the front
  for (const [x, y0] of [[13, 33], [20, 36], [28, 36], [35, 33]]) for (let y = y0; y <= 41; y++) if (cv.get(x, y) === 'b') px(cv, x, y, 's')
  for (const [x, y] of [[14, 33], [14, 34], [21, 36], [21, 37]]) if (cv.get(x, y) === 'b') px(cv, x, y, 'l')
  // stubby arms in front of the sheet
  for (const flip of [false, true]) {
    const cx = flip ? 40.5 : 7.5
    const arm = ellipse(W, H, cx, 29, 3.4, 5.6)
    solid(cv, arm, P, { rad: 3.4 })
  }
  // glossy streak + specular spot (top-left)
  dots(cv, [[14, 15], [14, 14], [15, 12], [16, 11], [17, 10], [19, 9], [20, 9]], 'h')
  gloss(cv, 18, 12, 2, 1, 'w')
  // accent glints on rim
  for (const [x, y] of [[38, 23], [38, 24], [40, 36], [8, 37]]) if (cv.get(x, y) !== '.') px(cv, x, y, 'a')

  // sad droopy eyes
  const eye = (flip) => {
    const X = (x) => (flip ? 47 - x : x)
    const e = ellipse(W, H, 17, 18, 3.4, 4.2)
    for (const [x0, y] of e.cells()) {
      const x = X(x0)
      const lidY = 13.5 + (x0 < 17 ? 4.2 : 0) + (17 - x0) * -0.0
      // lid slants: inner (right of left eye) high, outer low
      const lid = 14.5 + (17 - x0) * 0.55 + 1.2
      if (y >= lid) px(cv, x, y, 'k')
    }
    px(cv, X(15), 18, 'w'); px(cv, X(16), 18, 'w'); px(cv, X(15), 19, 'w')
    px(cv, X(18), 20, 'a')
    // heavy lid line and brow
    for (const [x0, y] of [[13, 17], [14, 16], [15, 16], [16, 15], [17, 15], [18, 14], [19, 14]]) px(cv, X(x0), y, 'o')
    for (const [x0, y] of [[19, 10], [18, 10], [17, 11], [16, 11], [15, 12], [14, 12], [13, 13]]) px(cv, X(x0), y, 's')
    px(cv, X(15), 23, 'a'); px(cv, X(15), 24, 'a')
  }
  eye(false); eye(true)
  save('null-ghost', cv, {
    h: '#F4FDFF', l: '#D9F2F8', b: '#AEDDEA', s: '#72A9C4', r: '#8CC8DE', o: '#17435E',
    a: '#7FE3F2', k: '#0B2433', w: '#FFFFFF', g: GROUND,
  }, 'Null Ghost - profile.js')
}

// ---------------------------------------------------------------- off-by-one
export function offByOne() {
  const W = 48, H = 48
  const cv = new Canvas(W, H)
  const P = { h: 'h', l: 'l', b: 'b', s: 's', r: 'r', o: 'o' }
  const OX = 4 // the body stands one block (4px) to the right of where its shadow says it should
  // shadow = where it SHOULD stand
  floorShadow(cv, 22, 44.5, 16.5, 3, 'g')

  // five stubby legs where four would fit
  for (const x of [14, 19, 24, 29, 34]) {
    solid(cv, rect(W, H, x + OX - 3, 38, x + OX - 1, 43), P, { rad: 2 })
    fillRect(cv, x + OX - 3, 43, x + OX - 1, 43, 's')
  }
  const x0 = 12 + OX, x1 = 33 + OX, y0 = 17, y1 = 39
  const bx = box3d(cv, x0, y0, x1, y1, 6, 5, P)
  // accent glints on top-left rim
  dots(cv, [[x0 + 1, y0 + 1], [x0 + 2, y0 + 1], [x0 + 1, y0 + 2]], 'a')
  // rivets
  for (const [x, y] of [[x0 + 2, y1 - 2], [x1 - 2, y1 - 2], [x0 + 2, y0 + 3]]) { px(cv, x, y, 'h'); px(cv, x + 1, y + 1, 's') }
  // cracks on the side face
  dots(cv, [[x1 + 3, y0 - 1], [x1 + 4, y0], [x1 + 3, y0 + 1], [x1 + 4, y0 + 2], [x1 + 4, y0 + 3], [x1 + 5, y0 + 4]], 'o')
  dots(cv, [[x0 + 1, y1 - 6], [x0 + 2, y1 - 5], [x0 + 1, y1 - 4]], 's')

  // grumpy brows: thick, inner ends low
  const brow = (pts) => { for (const [x, y] of pts) { px(cv, x, y, 'o'); px(cv, x, y + 1, 'o') } }
  const ex = x0 // left edge of the face
  brow([[ex + 2, 21], [ex + 3, 21], [ex + 4, 21], [ex + 5, 22], [ex + 6, 22], [ex + 7, 22], [ex + 8, 23], [ex + 9, 23]])
  brow([[ex + 20, 23], [ex + 19, 23], [ex + 18, 23], [ex + 17, 24], [ex + 16, 24], [ex + 15, 25]])
  // two square eyes of different sizes
  fillRect(cv, ex + 3, 25, ex + 9, 31, 'o'); fillRect(cv, ex + 4, 26, ex + 8, 30, 'w')
  fillRect(cv, ex + 5, 27, ex + 7, 29, 'k'); px(cv, ex + 5, 27, 'w')
  fillRect(cv, ex + 14, 27, ex + 18, 31, 'o'); fillRect(cv, ex + 15, 28, ex + 17, 30, 'w')
  fillRect(cv, ex + 16, 29, ex + 16, 30, 'k'); px(cv, ex + 15, 28, 'w')
  // mouth with a row of square teeth and one extra tooth poking out
  fillRect(cv, ex + 2, 33, ex + 19, 38, 'o'); fillRect(cv, ex + 3, 34, ex + 18, 37, 'k')
  for (const x of [3, 7, 11]) { fillRect(cv, ex + x, 34, ex + x + 2, 36, 'w'); px(cv, ex + x + 2, 36, 'l') }
  fillRect(cv, ex + 15, 34, ex + 17, 40, 'w'); px(cv, ex + 14, 39, 'o'); px(cv, ex + 14, 40, 'o'); px(cv, ex + 18, 39, 'o'); px(cv, ex + 18, 40, 'o')
  fillRect(cv, ex + 15, 41, ex + 17, 41, 'o')
  px(cv, ex + 17, 38, 'l'); px(cv, ex + 17, 39, 'l'); px(cv, ex + 17, 40, 'l')
  save('off-by-one', cv, {
    h: '#FFD3EA', l: '#F7A0CF', b: '#E86FB0', s: '#A83A74', r: '#C75290', o: '#3D0F29',
    a: '#FFE27A', k: '#24091A', w: '#FFF3E0', g: GROUND,
  }, 'Off By One - pagination.js')
}
