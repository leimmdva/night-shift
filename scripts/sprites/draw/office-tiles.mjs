// Room architecture: floor tiles, walls, windows, doors and wall-mounted signs.
import {
  Canvas, MAT, GLOW, SH, cuboid, face, vol, seg, R, E, P, rnd, outline, fill,
  drawText, textW, saveOffice, dotsAt, putIfEmpty,
} from './office-lib.mjs'

// ------------------------------------------------------------------ floor: warm wood planks, 32x32, tileable
function planks(name, seed, o = {}) {
  const cv = new Canvas(32, 32)
  const P1 = MAT.plank, PD = MAT.plankDk
  for (let row = 0; row < 4; row++) {
    const y0 = row * 8
    const dark = o.dark?.includes(row)
    const M = dark ? PD : P1
    const joint = (Math.floor(rnd(row, 3, seed) * 20) + 6 + (o.shift ?? 0) * 11) % 32
    for (let y = y0; y < y0 + 8; y++) for (let x = 0; x < 32; x++) {
      let c = M.b
      if (y === y0) c = M.o
      else if (y === y0 + 1) c = M.h
      else if (y === y0 + 7) c = M.s
      else if (rnd(x, y, seed + row) < 0.07) c = M.l
      else if (rnd(x >> 2, y, seed + row + 9) < 0.09) c = M.s
      cv.set(x, y, c)
    }
    for (let y = y0; y < y0 + 8; y++) { cv.set(joint, y, M.o); cv.set((joint + 1) % 32, y, M.h) }
    // two short grain streaks
    for (let k = 0; k < 2; k++) { const gx = Math.floor(rnd(row, k, seed + 5) * 22); for (let i = 0; i < 6; i++) cv.set((gx + i) % 32, y0 + 3 + k * 2, M.s) }
  }
  if (o.stain) for (const [x, y] of [[12, 12], [13, 12], [14, 13], [13, 14], [20, 21], [21, 21], [21, 22]]) cv.set(x, y, MAT.plankDk.s)
  saveOffice(name, cv, { feet: 32, ax: 0 }, `Floor tile ${name}`)
}
export function floors() {
  planks('floor_a', 11, { dark: [2], shift: 0 })
  planks('floor_b', 23, { dark: [0], shift: 1 })
  planks('floor_worn', 37, { dark: [1, 3], shift: 2 })
  planks('floor_stain', 51, { dark: [2], shift: 3, stain: true })
}

// ------------------------------------------------------------------ back wall (front face, 32x96, tileable) and thick wall tops
export function wallFront() {
  const cv = new Canvas(32, 96)
  const C = MAT.wallCap, W = MAT.wall
  // top cap, 7px
  for (let y = 0; y < 7; y++) for (let x = 0; x < 32; x++) cv.set(x, y, y === 0 ? C.o : y === 1 ? C.h : y < 5 ? C.l : y === 5 ? C.b : C.s)
  // cream plaster face with faint panel lines and a shadow under the cap
  for (let y = 7; y < 96; y++) for (let x = 0; x < 32; x++) {
    let c = W.h
    if (rnd(x, y, 8) < 0.04) c = W.l
    if (x === 0) c = W.l
    if (x === 31) c = W.b
    cv.set(x, y, c)
  }
  for (let x = 0; x < 32; x++) { cv.set(x, 7, W.b); if (x % 2 === 0) cv.set(x, 8, W.l) }
  // chair rail
  for (let x = 0; x < 32; x++) { cv.set(x, 66, MAT.wood.h); cv.set(x, 67, MAT.wood.l); cv.set(x, 68, MAT.wood.b); cv.set(x, 69, MAT.wood.o) }
  // wainscot: warm wood panels
  for (let y = 70; y < 90; y++) for (let x = 0; x < 32; x++) {
    let c = MAT.wood.b
    if (x % 16 === 0) c = MAT.wood.o
    else if (x % 16 === 1) c = MAT.wood.l
    else if (x % 16 === 15) c = MAT.wood.s
    else if (y === 70) c = MAT.wood.s
    else if (y === 89) c = MAT.wood.s
    else if (rnd(x, y, 3) < 0.05) c = MAT.wood.l
    cv.set(x, y, c)
  }
  for (let x = 0; x < 32; x++) { cv.set(x, 90, MAT.wood.o) }
  // baseboard
  for (let x = 0; x < 32; x++) { cv.set(x, 91, MAT.wood.l); cv.set(x, 92, MAT.wood.b); cv.set(x, 93, MAT.wood.b); cv.set(x, 94, MAT.wood.s); cv.set(x, 95, MAT.wood.o) }
  saveOffice('wall_front', cv, { feet: 96, ax: 0 }, 'Back wall, front face (3 tiles tall)')
}
// Thick walls (16px): lit top surface, dark outer border, a darker inner face towards the room.
export function wallTops() {
  const C = MAT.wallCap
  const h = new Canvas(32, 16) // bottom wall: top surface rows 3..11, inner face rows 0..2 (towards the room, above)
  for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) {
    let c
    if (y === 0) c = C.o
    else if (y === 1) c = C.s
    else if (y === 2) c = C.b
    else if (y === 3) c = C.h
    else if (y < 11) c = y === 4 ? C.h : C.l
    else if (y === 11) c = C.b
    else if (y < 14) c = C.s
    else c = C.o
    h.set(x, y, c)
  }
  saveOffice('wall_top_h', h, { feet: 16, ax: 0 }, 'Wall top, horizontal (bottom wall, 16px thick)')
  const v = new Canvas(16, 32) // left wall as drawn; the right wall is its mirror
  for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) {
    let c
    if (x < 2) c = C.o
    else if (x < 4) c = x === 2 ? C.h : C.l
    else if (x < 12) c = C.l
    else if (x === 12) c = C.b
    else if (x < 15) c = C.s
    else c = C.o
    if (x > 3 && x < 11 && rnd(x, y, 2) < 0.04) c = C.h
    v.set(x, y, c)
  }
  saveOffice('wall_top_v', v, { feet: 32, ax: 0 }, 'Wall top, vertical (side walls, 16px thick; left-wall orientation)')
  const c = new Canvas(16, 16)
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) c.set(x, y, x === 0 || y === 0 || x === 15 || y === 15 ? C.o : x < 3 || y < 3 ? C.h : x < 12 && y < 12 ? C.l : x === 12 || y === 12 ? C.b : C.s)
  saveOffice('wall_corner', c, { feet: 16, ax: 0 }, 'Wall corner (16px)')
}

// ------------------------------------------------------------------ night windows (glass shows sky, moon and far city lights)
function windowNight(name, o) {
  const WW = 76
  const cv = new Canvas(WW, 58)
  const F = MAT.white
  const fx0 = 2, fy0 = 1, fx1 = WW - 3, fy1 = 48
  face(cv, fx0, fy0, fx1, fy1, F)
  const gx0 = fx0 + 3, gy0 = fy0 + 3, gx1 = fx1 - 3, gy1 = fy1 - 3
  const bands = [[0, GLOW.skyA], [9, GLOW.skyB], [17, GLOW.skyC], [24, GLOW.skyD]]
  for (let y = gy0; y <= gy1; y++) {
    const t = y - gy0
    let c = bands[0][1]
    for (const [t0, bc] of bands) if (t >= t0) c = bc
    for (let x = gx0; x <= gx1; x++) cv.set(x, y, c)
  }
  // stars
  for (let i = 0; i < 12; i++) {
    const x = gx0 + 1 + Math.floor(rnd(i, 4, o.seed) * (gx1 - gx0 - 1)), y = gy0 + 1 + Math.floor(rnd(i, 5, o.seed) * 14)
    cv.set(x, y, GLOW.star)
  }
  // moon with a crescent bite
  if (o.moon) {
    const [mx, my] = o.moon
    for (const [x, y] of E(cv, mx, my, 5.2, 5.2).cells()) cv.set(x, y, GLOW.moon)
    for (const [x, y] of E(cv, mx + 2.2, my - 1.2, 4.3, 4.3).cells()) cv.set(x, y, my > gy0 + 12 ? GLOW.skyC : GLOW.skyB)
    for (const [x, y] of E(cv, mx, my, 5.2, 5.2).cells()) if (cv.get(x, y) === GLOW.moon && (x + y) % 5 === 0 && x < mx) cv.set(x, y, GLOW.moonDk)
  }
  // far city skyline with a few lit windows
  const base = gy1
  let x = gx0
  let i = 0
  while (x <= gx1) {
    const bw = 3 + Math.floor(rnd(i, 1, o.seed + 9) * 5)
    const bh = 5 + Math.floor(rnd(i, 2, o.seed + 9) * 9)
    for (let yy = base - bh; yy <= base; yy++) for (let xx = x; xx < Math.min(gx1 + 1, x + bw); xx++) cv.set(xx, yy, '#0A1024')
    for (let yy = base - bh + 2; yy < base; yy += 2) for (let xx = x + 1; xx < Math.min(gx1, x + bw - 1); xx += 2) {
      if (rnd(xx, yy, o.seed + 3) < 0.35) cv.set(xx, yy, rnd(xx, yy, 6) < 0.3 ? GLOW.cityDk : GLOW.city)
    }
    x += bw
    i++
  }
  // a red aircraft light on the tallest block
  if (o.beacon) cv.set(o.beacon[0], o.beacon[1], GLOW.ledR)
  // mullions
  const my = gy0 + 18
  for (const mx of [gx0 + Math.floor((gx1 - gx0) / 3), gx0 + Math.floor(((gx1 - gx0) * 2) / 3)]) for (let yy = gy0; yy <= gy1; yy++) { cv.set(mx, yy, F.l); cv.set(mx + 1, yy, F.s) }
  for (let xx = gx0; xx <= gx1; xx++) { cv.set(xx, my, F.l); cv.set(xx, my + 1, F.s) }
  // frame shadow inside the glass (top and left), then pane highlight streaks
  for (let xx = gx0; xx <= gx1; xx++) cv.set(xx, gy0, '#050A1E')
  for (let yy = gy0; yy <= gy1; yy++) cv.set(gx0, yy, '#050A1E')
  seg(cv, [[gx0 + 4, gy0 + 12], [gx0 + 8, gy0 + 6]], GLOW.skyD)
  seg(cv, [[gx1 - 10, gy1 - 9], [gx1 - 5, gy1 - 16]], GLOW.skyD)
  outline(cv, R(cv, gx0, gy0, gx1, gy1), F.o)
  // sill sticking out into the room
  cuboid(cv, 0, 49, WW - 1, 55, 3, MAT.wallCap, { bot: 1 })
  saveOffice(name, cv, { feet: 55, ax: 0 }, 'Night window')
}
export function windows() {
  windowNight('window_night_a', { seed: 1, moon: [52, 13], beacon: [20, 30] })
  windowNight('window_night_b', { seed: 7, moon: [14, 12], beacon: [50, 32] })
}

// ------------------------------------------------------------------ whiteboard with the crossed-out schedule
export function whiteboard() {
  const cv = new Canvas(100, 40)
  const F = MAT.metal
  face(cv, 1, 1, 98, 33, F)
  const bx0 = 4, by0 = 4, bx1 = 95, by1 = 30
  for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) cv.set(x, y, MAT.white.l)
  for (let x = bx0; x <= bx1; x++) cv.set(x, by0, MAT.white.h)
  for (let y = by0; y <= by1; y++) cv.set(bx0, y, MAT.white.h)
  for (let x = bx0; x <= bx1; x++) cv.set(x, by1, MAT.white.b)
  // ghosting from old erased marker
  for (let i = 0; i < 18; i++) { const x = bx0 + 3 + Math.floor(rnd(i, 1, 6) * 84), y = by0 + 3 + Math.floor(rnd(i, 2, 6) * 22); cv.set(x, y, MAT.white.b); cv.set(x + 1, y, MAT.white.b) }
  const BLUE = '#2A56B8', RED = '#D83A2A', GRN = '#2E8F4A', BLK = '#2A2A3A'
  // title, crossed out
  drawText(cv, 8, 7, 'ship it friday', BLUE)
  seg(cv, [[6, 9], [63, 9]], RED)
  drawText(cv, 8, 14, 'next week', GRN)
  // block diagram: three boxes and arrows
  const boxAt = (x, y, c, n) => {
    for (let i = 0; i < 14; i++) { cv.set(x + i, y, c); cv.set(x + i, y + 7, c) }
    for (let j = 0; j < 8; j++) { cv.set(x, y + j, c); cv.set(x + 13, y + j, c) }
    if (n) drawText(cv, x + 5, y + 2, n, c)
  }
  boxAt(8, 21, BLUE, 'a'); boxAt(32, 21, BLUE, 'b'); boxAt(56, 21, RED, '')
  seg(cv, [[22, 24], [31, 24]], BLK); seg(cv, [[29, 22], [31, 24], [29, 26]], BLK)
  seg(cv, [[46, 24], [55, 24]], BLK); seg(cv, [[53, 22], [55, 24], [53, 26]], BLK)
  seg(cv, [[58, 23], [67, 28]], RED); seg(cv, [[67, 23], [58, 28]], RED)
  // small ghost doodle and a spiral
  const gh = P(cv, [[78, 20], [86, 20], [87, 29], [85, 27], [83, 29], [81, 27], [79, 29], [77, 29]])
  for (const [x, y] of gh.cells()) if (!gh.has(x - 1, y) || !gh.has(x + 1, y) || !gh.has(x, y - 1) || !gh.has(x, y + 1)) cv.set(x, y, BLK)
  cv.set(80, 23, BLK); cv.set(84, 23, BLK); cv.set(82, 25, BLK)
  seg(cv, [[78, 9], [84, 9], [84, 14], [79, 14], [79, 11], [82, 11]], GRN)
  seg(cv, [[89, 8], [92, 12], [89, 16]], BLUE)
  // sticky note and marker tray
  fill(cv, R(cv, 87, 20, 92, 25), '#FFE86A'); cv.set(88, 22, '#8A7A30'); cv.set(89, 22, '#8A7A30'); cv.set(90, 22, '#8A7A30'); cv.set(88, 23, '#8A7A30')
  outline(cv, R(cv, 87, 20, 92, 25), '#8A7A30')
  cuboid(cv, 14, 34, 84, 37, 2, MAT.metal, { bot: 1 })
  for (const [x, c] of [[24, RED], [32, BLUE], [40, GRN]]) { fill(cv, R(cv, x, 33, x + 5, 34), c); cv.set(x - 1, 34, MAT.plastic.o) }
  saveOffice('whiteboard', cv, { feet: 38, ax: 1 }, 'Whiteboard: SHIP IT FRIDAY crossed out')
}

// ------------------------------------------------------------------ wall clock, 3:00
export function wallClock() {
  const cv = new Canvas(22, 22)
  const ring = E(cv, 11, 11, 10, 10)
  vol(cv, ring, MAT.plastic, { rad: 3 })
  const face = E(cv, 11, 11, 7.6, 7.6)
  for (const [x, y] of face.cells()) cv.set(x, y, '#F1EBD4')
  for (const [x, y] of face.cells()) if (!face.has(x - 1, y) || !face.has(x, y - 1)) cv.set(x, y, '#FFFFF2')
  for (const [x, y] of face.cells()) if (!face.has(x + 1, y) || !face.has(x, y + 1)) cv.set(x, y, '#B9B196')
  // ticks at 12, 3, 6, 9
  for (const [x, y] of [[10, 4], [11, 4], [10, 17], [11, 17], [4, 10], [4, 11], [17, 10], [17, 11]]) cv.set(x, y, '#2A2438')
  // 3:00: hour hand to the right, minute hand straight up
  seg(cv, [[11, 11], [15, 11]], '#17102A'); seg(cv, [[11, 12], [15, 12]], '#17102A')
  seg(cv, [[11, 11], [11, 5]], '#17102A'); seg(cv, [[10, 11], [10, 5]], '#17102A')
  cv.set(10, 11, '#D83A2A'); cv.set(11, 11, '#D83A2A'); cv.set(10, 12, '#D83A2A'); cv.set(11, 12, '#D83A2A')
  saveOffice('wall_clock', cv, { feet: 22, ax: 0 }, 'Wall clock showing 3:00')
}

// ------------------------------------------------------------------ server room door
export function doorServer() {
  const cv = new Canvas(64, 64)
  const S = MAT.steel
  // frame and heavy leaf
  face(cv, 0, 6, 63, 63, S, { c: S.s })
  for (let y = 7; y <= 62; y++) for (let x = 1; x <= 62; x++) cv.set(x, y, S.s)
  for (let x = 1; x <= 62; x++) cv.set(x, 7, S.l)
  face(cv, 5, 10, 58, 63, S)
  for (let y = 11; y <= 62; y++) for (let x = 6; x <= 57; x++) if (rnd(x, y, 12) < 0.05) cv.set(x, y, S.l)
  // hinge blocks on the left, bolts
  for (const y of [16, 34, 52]) { cuboid(cv, 1, y, 5, y + 6, 2, S, { bot: 1 }) }
  // reinforcing bars with rivets
  for (const y0 of [44, 53]) {
    for (let y = y0; y < y0 + 4; y++) for (let x = 7; x <= 56; x++) cv.set(x, y, y === y0 ? S.h : y === y0 + 3 ? S.o : S.l)
    for (let x = 10; x <= 54; x += 8) { cv.set(x, y0 + 1, S.o); cv.set(x + 1, y0 + 1, S.h) }
  }
  // sign plate: black with amber letters
  const plate = R(cv, 12, 12, 51, 22)
  fill(cv, plate, '#14121C')
  for (let x = 12; x <= 51; x++) { cv.set(x, 12, '#2C2A38'); cv.set(x, 22, GLOW.amberDk) }
  outline(cv, plate, '#05040A')
  drawText(cv, 32 - Math.floor(textW('server') / 2), 15, 'server', GLOW.serverSign)
  for (const x of [13, 50]) cv.set(x, 17, GLOW.serverSign)
  // small window: a rack inside with green and amber LEDs
  const win = R(cv, 22, 26, 41, 40)
  fill(cv, win, '#0A141C')
  for (let y = 28; y <= 38; y += 3) {
    for (let x = 24; x <= 39; x++) cv.set(x, y + 1, '#16222C')
    for (let k = 0; k < 6; k++) {
      const x = 25 + k * 2 + (y % 2)
      cv.set(x, y, rnd(x, y, 5) < 0.55 ? GLOW.ledG : rnd(x, y, 6) < 0.5 ? GLOW.ledA : GLOW.ledG)
    }
  }
  cv.set(38, 29, GLOW.ledR)
  for (let x = 22; x <= 41; x++) { cv.set(x, 26, '#050A10') }
  for (let y = 26; y <= 40; y++) cv.set(22, y, '#050A10')
  seg(cv, [[36, 28], [32, 36]], '#2A4252')
  for (let x = 22; x <= 41; x++) cv.set(x, 41, S.h)
  outline(cv, win, S.o)
  // keypad and handle bar
  fill(cv, R(cv, 46, 28, 51, 36), '#14121C'); outline(cv, R(cv, 46, 28, 51, 36), S.o)
  cv.set(48, 30, GLOW.ledR); cv.set(49, 30, GLOW.ledR); for (const [x, y] of [[47, 32], [49, 32], [47, 34], [49, 34]]) cv.set(x, y, S.l)
  fill(cv, R(cv, 11, 28, 14, 38), MAT.metal.l)
  for (let y = 28; y <= 38; y++) { cv.set(11, y, MAT.metal.h); cv.set(14, y, MAT.metal.s) }
  outline(cv, R(cv, 11, 28, 14, 38), MAT.metal.o)
  // hazard stripe along the bottom
  for (let y = 59; y <= 62; y++) for (let x = 6; x <= 57; x++) cv.set(x, y, ((x + y) >> 2) % 2 ? GLOW.amber : '#17141C')
  saveOffice('door_server', cv, { feet: 63, ax: 0 }, 'Heavy server room door')
}

// ------------------------------------------------------------------ entrance (gap in the bottom wall, bottom-left)
export function doorEntrance() {
  const cv = new Canvas(64, 52)
  const C = MAT.wallCap
  // wall caps either side of the opening, 8px high, flush with the bottom of the image
  for (const [x0, x1] of [[0, 5], [58, 63]]) {
    for (let y = 36; y < 52; y++) for (let x = x0; x <= x1; x++) cv.set(x, y, y === 36 || y === 51 ? C.o : y === 37 ? C.h : y < 47 ? C.l : y === 47 ? C.b : C.s)
    for (let y = 36; y < 52; y++) cv.set(x0 === 0 ? x1 : x0, y, C.o)
  }
  // the opening: dark hallway beyond, a metal threshold strip
  for (let y = 38; y < 52; y++) for (let x = 6; x <= 57; x++) cv.set(x, y, '#0E1424')
  for (let x = 6; x <= 57; x++) { cv.set(x, 37, MAT.metal.l); cv.set(x, 38, MAT.metal.b); cv.set(x, 39, MAT.metal.s) }
  for (let x = 6; x <= 57; x += 6) cv.set(x, 38, MAT.metal.o)
  for (let x = 8; x <= 55; x += 5) for (let y = 43; y <= 48; y++) cv.set(x, y, '#18213A')
  // open glass door leaf standing on the left hinge, seen edge-on running back into the room
  const leaf = R(cv, 7, 12, 10, 36)
  fill(cv, leaf, '#7C9CB8')
  for (let y = 12; y <= 36; y++) { cv.set(7, y, '#C8DCEC'); cv.set(10, y, '#4E6A84') }
  for (let x = 7; x <= 10; x++) cv.set(x, 12, '#DDEBF6')
  for (let y = 16; y < 34; y += 3) cv.set(8, y, '#D6E8F4')
  outline(cv, leaf, '#1C2838')
  fill(cv, R(cv, 11, 28, 12, 31), '#1C2838'); cv.set(11, 29, MAT.metal.h)
  // pole-mounted EXIT sign on the right post
  fill(cv, R(cv, 53, 14, 54, 36), MAT.plastic.b)
  for (let y = 14; y <= 36; y++) { cv.set(53, y, MAT.plastic.l); cv.set(54, y, MAT.plastic.s) }
  outline(cv, R(cv, 53, 14, 54, 36), MAT.plastic.o)
  const sign = R(cv, 35, 3, 60, 12)
  fill(cv, sign, '#0F3626')
  for (let x = 35; x <= 60; x++) { cv.set(x, 3, '#2F7A56') }
  for (let y = 3; y <= 12; y++) cv.set(35, y, '#2F7A56')
  outline(cv, sign, '#06150E')
  drawText(cv, 42, 5, 'exit', GLOW.exit)
  for (let x = 41; x <= 54; x++) cv.set(x, 11, GLOW.exit)
  saveOffice('door_entrance', cv, { feet: 52, ax: 0 }, 'Entrance door gap with pole-mounted EXIT sign')
}
