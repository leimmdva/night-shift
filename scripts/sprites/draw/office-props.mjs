// Furniture sprites. Every body is drawn as: contact shadow first, then top face + front face, 1px outline in the darkest shade.
import {
  Canvas, MAT, GLOW, SH, castShadow, ellipseShadow, cuboid, face, vol, seg, R, E, P, rnd, outline, fill,
  drawText, saveOffice, dotsAt, putIfEmpty, blit,
} from './office-lib.mjs'
import {
  drawPumpkin, drawWitchHat, drawMonitor, drawKeyboard, drawMouse, drawMug, drawSticky, drawPapers, drawPotPlant,
  drawCandyBowl, drawBat,
} from './office-decor.mjs'

const DARK = '#0A0612'

// ------------------------------------------------------------------ cloth skirt that hangs to the floor
export function drawDrape(cv, x0, x1, y0, y1, MC, o = {}) {
  const body = R(cv, x0, y0, x1, y1)
  for (const [x, y] of body.cells()) {
    const k = (x - x0) % 7
    let c = MC.b
    if (k < 2) c = MC.l
    else if (k >= 5) c = MC.s
    cv.set(x, y, c)
  }
  for (let x = x0; x <= x1; x++) cv.set(x, y0, MC.h)
  // orange hem with a scalloped edge
  for (let x = x0; x <= x1; x++) {
    const k = (x - x0) % 7
    for (let y = y1 - 3; y <= y1; y++) cv.set(x, y, y === y1 - 3 ? MAT.trim.h : k >= 5 ? MAT.trim.s : MAT.trim.b)
    if (k === 6 || k === 0) cv.set(x, y1, '.')
  }
  outline(cv, body, MC.o)
  // opening in the cloth: a dark wedge you could crawl through
  if (o.slit !== false) {
    const cx = o.slitX ?? Math.round((x0 + x1) / 2)
    const w = o.slitW ?? 4
    const top = y0 + 3
    const wedge = P(cv, [[cx - 0.5, top], [cx + 1.5, top], [cx + w + 1, y1 + 0.5], [cx - w, y1 + 0.5]])
    for (const [x, y] of wedge.cells()) cv.set(x, y, DARK)
    for (const [x, y] of wedge.cells()) if (!wedge.has(x - 1, y)) cv.set(x - 1, y, MC.h)
    for (let y = top + 4; y < y1 - 3; y += 3) { const x = Math.round(cx + 0.5 + ((y - top) / (y1 - top)) * -0.5); cv.set(x, y, '#1B1230') }
  }
}

// ------------------------------------------------------------------ desks (64 wide, 18 deep top + 14 front)
const DESK = { x0: 2, y0: 18, x1: 65, y1: 43, td: 12 }
export function deskBase(cv, { skirt = false } = {}) {
  const { x0, y0, x1, y1, td } = DESK
  castShadow(cv, x0, x1, y1, { depth: 3, shift: 4 })
  if (skirt) {
    cuboid(cv, x0, y0, x1, y0 + td, td, MAT.wood, { grain: 3, bot: 0, outline: false })
    // table top overhangs the cloth by one row, cloth hangs on the front
    drawDrape(cv, x0 + 1, x1 - 1, y0 + td + 1, y1, MAT.clothBlack)
    outline(cv, R(cv, x0, y0, x1, y0 + td), MAT.wood.o)
    for (let x = x0; x <= x1; x++) cv.set(x, y0 + td, MAT.wood.s)
    return
  }
  cuboid(cv, x0, y0, x1, y1, td, MAT.wood, { grain: 3 })
  // drawer pedestal on the right and a modesty panel line
  const px0 = x1 - 17, py0 = y0 + td + 3
  for (let y = py0; y < y1 - 1; y++) for (let x = px0; x < x1; x++) cv.set(x, y, MAT.wood.b)
  for (let x = px0; x < x1; x++) { cv.set(x, py0, MAT.wood.h); cv.set(x, py0 + 5, MAT.wood.s); cv.set(x, y1 - 2, MAT.wood.s) }
  for (let y = py0; y < y1 - 1; y++) { cv.set(px0, y, MAT.wood.s); cv.set(px0 - 1, y, MAT.wood.l) }
  for (const hy of [py0 + 2, py0 + 7]) for (let x = px0 + 6; x <= px0 + 10; x++) cv.set(x, hy, MAT.metal.l)
  for (let x = x0 + 5; x <= px0 - 3; x++) cv.set(x, y0 + td + 3, MAT.wood.s)
}

function deskItems(cv, o) {
  drawMonitor(cv, 22, 2, o.screen ?? 'blue', o.seed ?? 1)
  drawKeyboard(cv, 25, 24)
  drawMouse(cv, 43, 25)
  if (o.sticky) { drawSticky(cv, 24, 4, '#FFE86A'); drawSticky(cv, 40, 12, '#FF9AC8') }
}

function newDesk() { return new Canvas(72, 50) }
const DESK_META = { feet: 43, ax: 2 }

export function deskPumpkin() {
  const cv = newDesk()
  deskBase(cv)
  deskItems(cv, { screen: 'blue', seed: 2, sticky: true })
  drawPumpkin(cv, 56, 28, 6)
  drawMug(cv, 11, 28)
  drawPapers(cv, 6, 21)
  saveOffice('desk_pumpkin', cv, DESK_META, 'Desk with jack-o-lantern')
}
export function deskWitch() {
  const cv = newDesk()
  deskBase(cv)
  deskItems(cv, { screen: 'green', seed: 5 })
  drawPotPlant(cv, 55, 28, 0.8)
  drawMug(cv, 11, 28, MAT.chair)
  const tall = new Canvas(72, 62)
  blit(tall, cv, 0, 12)
  drawWitchHat(tall, 33, 15) // sits on top of the monitor
  saveOffice('desk_witch', tall, { feet: 55, ax: 2 }, 'Desk with a witch hat on the monitor')
}
export function deskPlain() {
  const cv = newDesk()
  deskBase(cv)
  deskItems(cv, { screen: 'blue', seed: 8, sticky: true })
  drawPapers(cv, 52, 21)
  drawMug(cv, 12, 28, MAT.paper)
  saveOffice('desk_plain', cv, DESK_META, 'Plain desk')
}
export function deskSkirt() {
  const cv = newDesk()
  deskBase(cv, { skirt: true })
  deskItems(cv, { screen: 'blue', seed: 4 })
  drawPumpkin(cv, 55, 28, 5)
  drawBat(cv, 10, 24, 0, '#2A1E44') // paper bat taped on the desk
  saveOffice('desk_skirt', cv, DESK_META, 'Desk with a cloth skirt (hiding spot)')
}
export function deskPlayer() {
  const cv = newDesk()
  deskBase(cv)
  // open laptop: amber screen facing the camera, base on the desk
  const lx = 20, ly = 8
  // glow on the desk top
  for (const [x, y] of E(cv, lx + 13, 30, 18, 5).cells()) putIfEmpty(cv, x, y, '#E8A33D33')
  const lid = face(cv, lx, ly, lx + 25, ly + 15, MAT.plastic)
  void lid
  for (let y = ly + 2; y <= ly + 13; y++) for (let x = lx + 2; x <= lx + 23; x++) cv.set(x, y, GLOW.amber)
  for (let r = 0; r < 5; r++) {
    const len = 4 + Math.floor(rnd(r, 3, 2) * 11), ind = Math.floor(rnd(r, 1, 7) * 5)
    for (let i = 0; i < len && ind + i < 19; i++) cv.set(lx + 3 + ind + i, ly + 3 + r * 2, i < 3 ? GLOW.amberHi : GLOW.amberDk)
  }
  cv.set(lx + 2, ly + 2, GLOW.amberHi); cv.set(lx + 3, ly + 2, GLOW.amberHi)
  cuboid(cv, lx - 3, 24, lx + 28, 29, 4, MAT.plastic, { bot: 1 })
  for (let i = 0; i < 12; i++) { cv.set(lx + i * 2, 25, MAT.plastic.h); cv.set(lx + i * 2, 26, MAT.plastic.h) }
  for (let x = lx + 9; x <= lx + 16; x++) cv.set(x, 28, MAT.plastic.s)
  drawMug(cv, 52, 28)
  drawSticky(cv, 8, 22, '#FFE86A')
  drawPapers(cv, 5, 24 - 1)
  drawMouse(cv, 53 - 3, 19)
  saveOffice('desk_player', cv, DESK_META, "Player's desk with the open amber laptop")
}

// ------------------------------------------------------------------ chairs
function drawStar(cv, cx, by) {
  const c = MAT.plastic
  for (const [dx, dy] of [[-8, -1], [8, -1], [-5, 0], [5, 0], [0, 0]]) seg(cv, [[cx, by - 4], [cx + dx, by - 2 + dy]], c.o)
  for (const dx of [-9, -5, 0, 5, 9]) { cv.set(cx + dx, by - 1, c.l); cv.set(cx + dx, by, c.o); cv.set(cx + dx + 1, by - 1, c.o) }
  for (let y = by - 8; y <= by - 4; y++) { cv.set(cx - 1, y, c.b); cv.set(cx, y, c.s); cv.set(cx - 2, y, c.o); cv.set(cx + 1, y, c.o) }
}
export function drawChairBack(cv, cx, by, M = MAT.chair) {
  ellipseShadow(cv, cx + 2, by - 1, 11, 3)
  drawStar(cv, cx, by)
  cuboid(cv, cx - 9, by - 13, cx + 8, by - 8, 2, M, { bot: 1 })
  const back = R(cv, cx - 8, by - 28, cx + 7, by - 12)
  vol(cv, back, M, { rad: 5 })
  for (let y = by - 24; y < by - 15; y++) cv.set(cx, y, M.s) // seam
  // armrest tips
  for (const dx of [-11, 10]) { fill(cv, R(cv, cx + dx, by - 15, cx + dx + 1, by - 11), MAT.plastic.b); outline(cv, R(cv, cx + dx, by - 15, cx + dx + 1, by - 11), MAT.plastic.o) }
}
export function chairBack() {
  const cv = new Canvas(30, 36)
  drawChairBack(cv, 14, 31, MAT.chair)
  saveOffice('chair_blue', cv, { feet: 31, ax: 5 }, 'Office chair, seen from behind')
  const cv2 = new Canvas(30, 36)
  drawChairBack(cv2, 14, 31, MAT.chairTeal)
  saveOffice('chair_teal', cv2, { feet: 31, ax: 5 }, 'Office chair (teal), seen from behind')
}
export function drawChairFront(cv, cx, by, M = MAT.chair, skeleton = false) {
  ellipseShadow(cv, cx + 2, by - 1, 11, 3)
  drawStar(cv, cx, by)
  const bh = skeleton ? 30 : 24
  const back = R(cv, cx - 9, by - 14 - bh, cx + 8, by - 13)
  vol(cv, back, M, { rad: 5 })
  cuboid(cv, cx - 10, by - 15, cx + 9, by - 8, 3, M, { bot: 1 })
  for (const dx of [-12, 11]) {
    cuboid(cv, cx + dx, by - 21, cx + dx + 1, by - 11, 2, MAT.plastic, { bot: 1 })
  }
}
export function chairFront() {
  const cv = new Canvas(30, 44)
  drawChairFront(cv, 15, 40, MAT.chairTeal)
  saveOffice('chair_front', cv, { feet: 40, ax: 5 }, 'Office chair, seen from the front')
}

const BONE = MAT.bone
function bone(cv, pts, w = 2) {
  for (let i = 0; i < pts.length - 1; i++) {
    seg(cv, [pts[i], pts[i + 1]], BONE.o)
  }
  for (let k = 0; k < w; k++) seg(cv, pts.map(([x, y]) => [x + k, y]), k === 0 ? BONE.l : BONE.b)
  void w
}
// Seated skeleton in profile at the right end of a desk: bent at the hips, thighs forward under the desk, headset on.
export function skeletonDesk() {
  const W = 108, H = 72, oy = 14
  const cv = new Canvas(W, H)
  const KB = MAT.plastic
  // chair (profile): star base, gas lift, seat, curved backrest
  ellipseShadow(cv, 90, 62, 15, 3)
  seg(cv, [[78, 63], [90, 60], [101, 63]], KB.o)
  seg(cv, [[78, 62], [90, 59], [101, 62]], KB.b)
  for (const x of [78, 90, 101]) { fill(cv, R(cv, x - 1, 63, x + 1, 64), KB.o) }
  fill(cv, R(cv, 89, 54, 91, 59), KB.l); outline(cv, R(cv, 89, 54, 91, 59), KB.o)
  const back = P(cv, [[98, 30], [102, 30], [103, 52], [97, 54]])
  vol(cv, back, MAT.chairTeal, { rad: 3 })
  cuboid(cv, 76, 49, 101, 55, 2, MAT.chairTeal, { bot: 1 })
  // legs: thigh forward (left) under the desk, shin down, foot on the floor
  const bonePath = (pts) => { for (let i = 0; i < pts.length - 1; i++) seg(cv, [pts[i], pts[i + 1]], BONE.o) }
  const thigh = R(cv, 66, 46, 88, 49); vol(cv, thigh, BONE, { rad: 2 })
  vol(cv, E(cv, 67, 47.5, 2.8, 2.6), BONE, { rad: 2 })
  const shin = R(cv, 65, 50, 67, 58); vol(cv, shin, BONE, { rad: 2 })
  vol(cv, E(cv, 63.5, 59.5, 3.8, 1.8), BONE, { rad: 2 })
  void bonePath
  // pelvis and the spine, bent forward from the hips
  vol(cv, E(cv, 91, 47, 4.5, 3.2), BONE, { rad: 3 })
  seg(cv, [[92, 44], [91, 40], [89, 36], [86, 33]], BONE.o)
  seg(cv, [[93, 44], [92, 40], [90, 36], [87, 33]], BONE.b)
  // ribcage, leaning towards the desk
  const ribs = P(cv, [[90, 29], [97, 31], [98, 40], [93, 43], [88, 41], [86, 34]])
  vol(cv, ribs, BONE, { rad: 4 })
  for (const y of [32, 35, 38, 41]) for (let x = 88 + (y > 40 ? 2 : 0); x <= 96; x++) if (ribs.has(x, y)) cv.set(x, y, BONE.s)
  // arm: upper arm down from the shoulder, forearm forward onto the desk
  vol(cv, R(cv, 88, 33, 90, 41), BONE, { rad: 2 })
  vol(cv, R(cv, 76, 40, 88, 42), BONE, { rad: 2 })
  vol(cv, E(cv, 75, 41, 2.4, 1.8), BONE, { rad: 2 })
  // neck and skull (profile, facing left), well below the monitor top
  fill(cv, R(cv, 86, 28, 88, 31), BONE.b)
  const skull = E(cv, 85, 24, 6.2, 5.8)
  const jaw = R(cv, 79, 25, 85, 29)
  vol(cv, skull.or(jaw), BONE, { rad: 5 })
  for (const [x, y] of E(cv, 82, 23, 1.7, 2).cells()) cv.set(x, y, '#150E1C')
  for (let x = 79; x <= 84; x++) cv.set(x, 29, x % 2 ? BONE.h : '#150E1C')
  seg(cv, [[79, 26], [79, 27]], '#150E1C')
  // headset: band over the skull, ear cup, boom mic
  seg(cv, [[80, 21], [83, 17], [88, 17], [91, 21]], KB.o)
  seg(cv, [[80, 22], [83, 18], [88, 18], [91, 22]], KB.b)
  const cup = R(cv, 86, 22, 90, 27); fill(cv, cup, KB.l); outline(cv, cup, KB.o); cv.set(88, 24, MAT.trim.l)
  seg(cv, [[86, 27], [84, 31], [81, 31]], KB.o)
  fill(cv, R(cv, 79, 31, 81, 32), MAT.trim.b)
  // desk on top of the thighs
  const d = new Canvas(72, 50)
  deskBase(d)
  drawMonitor(d, 22, 2, 'blue', 9)
  drawKeyboard(d, 25, 24); drawMouse(d, 43, 25)
  drawSticky(d, 6, 20, '#FF9AC8')
  drawMug(d, 56, 28, MAT.paper)
  drawBat(d, 8, 27, 1, '#2A1E44')
  blit(cv, d, 0, oy)
  // keyboard hand reaching the desk edge
  vol(cv, E(cv, 74, 54 - 12, 0.1, 0.1), BONE, { rad: 1 })
  saveOffice('desk_skeleton', cv, { feet: 43 + oy, ax: 2 }, 'Desk with a plastic skeleton seated at it, wearing a headset')
}

// ------------------------------------------------------------------ hiding-spot furniture
export function locker() {
  const cv = new Canvas(40, 80)
  const M = MAT.metal
  castShadow(cv, 3, 34, 72, { depth: 3, shift: 4 })
  cuboid(cv, 3, 6, 34, 72, 6, M, { bot: 3 })
  // door panel, slightly ajar on the right edge
  for (let y = 16; y <= 69; y++) { cv.set(31, y, M.s); cv.set(32, y, M.o); cv.set(33, y, '#0B1018') }
  for (let x = 6; x <= 30; x++) { cv.set(x, 15, M.h); cv.set(x, 69, M.s) }
  for (let y = 15; y <= 69; y++) cv.set(6, y, M.l)
  // vents
  for (const y0 of [19, 59]) for (let k = 0; k < 4; k++) for (let x = 10; x <= 26; x++) cv.set(x, y0 + k * 2, k % 2 === 0 ? M.o : M.s)
  // label plate, latch, sticker
  fill(cv, R(cv, 12, 32, 24, 38), MAT.paper.b)
  for (let x = 12; x <= 24; x++) cv.set(x, 32, MAT.paper.h)
  outline(cv, R(cv, 12, 32, 24, 38), M.o)
  drawText(cv, 14, 33, '07', MAT.paper.o)
  fill(cv, R(cv, 26, 44, 28, 54), MAT.white.b)
  for (let y = 44; y <= 54; y++) cv.set(26, y, MAT.white.h)
  outline(cv, R(cv, 26, 44, 28, 54), M.o)
  drawBat(cv, 9, 46, 1, '#1A1226')
  saveOffice('locker', cv, { feet: 72, ax: 3 }, 'Tall metal locker (hiding spot)')
}

export function closet() {
  const cv = new Canvas(54, 66)
  const F = MAT.wallCap
  // frame
  const frame = R(cv, 1, 2, 52, 62)
  fill(cv, frame, F.b)
  for (let x = 1; x <= 52; x++) { cv.set(x, 2, F.h); cv.set(x, 62, F.s) }
  for (let y = 2; y <= 62; y++) { cv.set(1, y, F.l); cv.set(52, y, F.s) }
  outline(cv, frame, F.o)
  // dark interior
  const inner = R(cv, 5, 10, 48, 59)
  fill(cv, inner, '#171221')
  for (let x = 5; x <= 48; x++) cv.set(x, 10, '#0B0812')
  for (let y = 10; y <= 59; y++) cv.set(5, y, '#0B0812')
  // shelves with supplies
  for (const sy of [26, 40, 53]) {
    for (let x = 22; x <= 47; x++) { cv.set(x, sy, MAT.woodDark.l); cv.set(x, sy + 1, MAT.woodDark.b); cv.set(x, sy + 2, MAT.woodDark.o) }
  }
  const box = (x0, y0, x1, y1, M) => { fill(cv, R(cv, x0, y0, x1, y1), M.b); for (let x = x0; x <= x1; x++) cv.set(x, y0, M.h); for (let y = y0; y <= y1; y++) { cv.set(x0, y, M.l); cv.set(x1, y, M.s) } outline(cv, R(cv, x0, y0, x1, y1), M.o) }
  box(24, 16, 31, 25, MAT.cardboard); box(33, 18, 39, 25, MAT.white); box(41, 15, 46, 25, MAT.cardboard)
  box(24, 31, 29, 39, MAT.jug); box(31, 33, 37, 39, MAT.cardboard); box(39, 30, 46, 39, MAT.white)
  box(24, 45, 33, 52, MAT.cardboard)
  vol(cv, E(cv, 41, 48, 4.4, 4.4), MAT.pumpkin, { rad: 4 })
  // mop leaning in the corner and a bucket
  seg(cv, [[46, 12], [41, 57]], MAT.woodDark.l)
  seg(cv, [[47, 12], [42, 57]], MAT.woodDark.o)
  vol(cv, E(cv, 41, 57, 4, 2.4), MAT.paper, { rad: 2 })
  // door leaf half open (swung towards the viewer on the left hinge)
  const leaf = P(cv, [[5, 10], [24, 14], [24, 56], [5, 60]])
  fill(cv, leaf, MAT.doorTeal.b)
  for (const [x, y] of leaf.cells()) {
    if (!leaf.has(x - 1, y)) cv.set(x, y, MAT.doorTeal.l)
    else if (!leaf.has(x, y - 1)) cv.set(x, y, MAT.doorTeal.h)
    else if (!leaf.has(x + 1, y)) cv.set(x, y, MAT.doorTeal.s)
    else if (x > 20) cv.set(x, y, MAT.doorTeal.s)
  }
  outline(cv, leaf, MAT.doorTeal.o)
  // leaf panels and louvre slats
  for (let k = 0; k < 6; k++) seg(cv, [[8, 20 + k * 3], [20, 22 + k * 3]], MAT.doorTeal.s)
  seg(cv, [[8, 42], [20, 44]], MAT.doorTeal.l)
  fill(cv, R(cv, 20, 36, 21, 37), GLOW.amber)
  // sign plate on the lintel
  const plate = R(cv, 14, 4, 40, 9)
  fill(cv, plate, '#2A2438')
  outline(cv, plate, '#0C0912')
  drawText(cv, 16, 4, 'supply', MAT.trim.h)
  saveOffice('closet', cv, { feet: 62, ax: 1 }, 'Supply closet with a half-open door (hiding spot)')
}

export function sofa() {
  const cv = new Canvas(108, 52)
  const M = MAT.sofa
  castShadow(cv, 4, 101, 46, { depth: 3, shift: 4 })
  // legs
  for (const x of [8, 94]) { fill(cv, R(cv, x, 45, x + 3, 47), MAT.woodDark.b); outline(cv, R(cv, x, 45, x + 3, 47), MAT.woodDark.o) }
  // backrest: top face and the front of the back cushions
  cuboid(cv, 4, 6, 101, 28, 5, M, { bot: 0, frontC: M.b })
  for (const x of [34, 69]) for (let y = 12; y <= 27; y++) { cv.set(x, y, M.s); cv.set(x + 1, y, M.l) }
  // seat: top face and the cushion fronts
  cuboid(cv, 10, 26, 95, 46, 10, M, { bot: 3, topC: M.l, frontC: M.b })
  for (const x of [38, 67]) { for (let y = 26; y <= 44; y++) { cv.set(x, y, M.s); cv.set(x + 1, y, M.l) } }
  for (let x = 11; x <= 94; x++) cv.set(x, 36, M.h)
  // arms
  for (const [x0, x1] of [[0, 11], [94, 105]]) {
    cuboid(cv, x0, 14, x1, 46, 8, M, { bot: 3 })
  }
  // orange throw pillow with a bat on it, folded blanket
  const pil = P(cv, [[18, 22], [34, 20], [35, 33], [19, 35]])
  fill(cv, pil, MAT.trim.b)
  for (const [x, y] of pil.cells()) { if (!pil.has(x - 1, y) || !pil.has(x, y - 1)) cv.set(x, y, MAT.trim.h); else if (!pil.has(x + 1, y) || !pil.has(x, y + 1)) cv.set(x, y, MAT.trim.s) }
  outline(cv, pil, MAT.trim.o)
  drawBat(cv, 21, 25, 0, '#2A1030')
  const blanket = R(cv, 74, 28, 90, 36)
  fill(cv, blanket, MAT.clothPurple.b)
  for (let x = 74; x <= 90; x++) { cv.set(x, 28, MAT.clothPurple.h); cv.set(x, 36, MAT.clothPurple.s); if ((x - 74) % 4 < 2) cv.set(x, 32, MAT.clothPurple.s) }
  outline(cv, blanket, MAT.clothPurple.o)
  saveOffice('sofa', cv, { feet: 46, ax: 4 }, 'Sofa (hide behind it)')
}

export function meetingTable() {
  const W = 140, H = 84
  const cv = new Canvas(W, H)
  const x0 = 4, x1 = 135, ty0 = 8, ty1 = 33, fy1 = 70
  const MC = MAT.clothPurple
  castShadow(cv, x0, x1, fy1, { depth: 4, shift: 5 })
  // table top (cloth)
  const top = R(cv, x0, ty0, x1, ty1)
  fill(cv, top, MC.l)
  for (let x = x0; x <= x1; x++) cv.set(x, ty0, MC.h)
  for (let y = ty0; y <= ty1; y++) cv.set(x0, y, MC.h)
  // orange runner with cobweb-ish dashes, and fold lines
  for (let x = x0 + 1; x <= x1 - 1; x++) { for (const y of [20, 21, 22]) cv.set(x, y, y === 20 ? MAT.trim.h : y === 21 ? MAT.trim.l : MAT.trim.s) }
  for (let x = x0 + 6; x < x1 - 6; x += 6) { cv.set(x, 21, MAT.trim.o) }
  for (let x = x0 + 1; x <= x1 - 1; x += 9) { cv.set(x, ty0 + 1, MC.b); cv.set(x + 1, ty0 + 1, MC.b) }
  for (let y = ty0 + 2; y <= ty1 - 2; y++) { cv.set(x1 - 1, y, MC.b) }
  outline(cv, top, MC.o)
  // drape to the floor
  drawDrape(cv, x0, x1, ty1 + 1, fy1, MC, { slitX: 66, slitW: 6 })
  // things on the table
  drawPumpkin(cv, 68, 17, 6)
  drawPapers(cv, 22, 12); drawPapers(cv, 100, 14)
  drawMug(cv, 36, 20); drawMug(cv, 88, 22, MAT.paper); drawMug(cv, 112, 19, MAT.chair)
  drawCandyBowl(cv, 50, 29)
  // speakerphone
  vol(cv, E(cv, 84, 28, 5, 2.4), MAT.plastic, { rad: 2 })
  cv.set(84, 28, MAT.trim.l)
  saveOffice('meeting_table', cv, { feet: fy1, ax: x0 }, 'Meeting table, cloth to the floor (hiding spot)')
}

export function plantDivider() {
  const W = 108, H = 78
  const cv = new Canvas(W, H)
  const x0 = 4, x1 = 103
  castShadow(cv, x0, x1, 74, { depth: 3, shift: 4 })
  cuboid(cv, x0, 58, x1, 74, 5, MAT.pot, { bot: 3 })
  // soil
  for (let y = 59; y <= 61; y++) for (let x = x0 + 2; x <= x1 - 2; x++) cv.set(x, y, '#3A2A22')
  for (let x = x0 + 2; x <= x1 - 2; x += 5) cv.set(x, 60, '#58423A')
  for (let x = x0 + 3; x < x1 - 3; x += 14) { for (let y = 63; y <= 71; y++) cv.set(x, y, MAT.pot.s) }
  // tall leafy hedge made of overlapping blobs
  const blobs = [
    [14, 48, 10, 11, 1], [30, 36, 12, 18, 0], [48, 26, 12, 24, 1], [66, 30, 12, 21, 0], [84, 36, 12, 17, 1], [95, 48, 9, 11, 0],
    [22, 52, 9, 6, 0], [40, 50, 9, 7, 1], [58, 50, 9, 7, 0], [76, 51, 9, 6, 1],
  ]
  for (const [x, y, rx, ry, d] of blobs) {
    const m = E(cv, x, y, rx, ry)
    vol(cv, m, d ? MAT.leafDark : MAT.leaf, { rad: Math.min(rx, ry) + 2 })
  }
  // re-draw the rim of the planter over the foliage base
  cuboid(cv, x0, 58, x1, 74, 5, MAT.pot, { bot: 3 })
  for (let y = 59; y <= 61; y++) for (let x = x0 + 2; x <= x1 - 2; x++) if (cv.get(x, y) === MAT.pot.l) cv.set(x, y, '#3A2A22')
  for (let x = x0 + 3; x < x1 - 3; x += 14) { for (let y = 63; y <= 71; y++) cv.set(x, y, MAT.pot.s) }
  // a few leaf spikes and fruit-like highlights
  for (const [x, y] of [[20, 33], [36, 18], [52, 8], [70, 14], [88, 22]]) { cv.set(x, y, MAT.leaf.h); cv.set(x + 1, y, MAT.leaf.h); cv.set(x, y + 1, MAT.leaf.h) }
  saveOffice('plant_divider', cv, { feet: 74, ax: x0 }, 'Large planter hedge / room divider (hiding spot)')
}

export function filingCabinet() {
  const cv = new Canvas(36, 56)
  const M = MAT.cabinet
  castShadow(cv, 3, 30, 50, { depth: 3, shift: 4 })
  cuboid(cv, 3, 6, 30, 50, 6, M, { bot: 2 })
  for (const dy of [0, 14, 28]) {
    const y0 = 14 + dy
    for (let x = 5; x <= 28; x++) { cv.set(x, y0, M.h); cv.set(x, y0 + 11, M.s) }
    for (let x = 5; x <= 28; x++) cv.set(x, y0 + 12, M.o)
    for (let x = 12; x <= 21; x++) cv.set(x, y0 + 7, MAT.metal.l)
    fill(cv, R(cv, 10, y0 + 2, 23, y0 + 4), MAT.paper.b)
    outline(cv, R(cv, 10, y0 + 2, 23, y0 + 4), M.o)
  }
  saveOffice('filing_cabinet', cv, { feet: 50, ax: 3 }, 'Filing cabinet')
}

export function fridge() {
  const cv = new Canvas(40, 70)
  const M = MAT.white
  castShadow(cv, 3, 34, 64, { depth: 3, shift: 4 })
  cuboid(cv, 3, 6, 34, 64, 6, M, { bot: 3 })
  for (let x = 5; x <= 32; x++) { cv.set(x, 30, M.s); cv.set(x, 31, M.o); cv.set(x, 32, M.h) }
  for (const [y0, y1] of [[18, 28], [36, 48]]) { for (let y = y0; y <= y1; y++) { cv.set(29, y, MAT.metal.b); cv.set(30, y, MAT.metal.s) } }
  // magnets and notes
  for (const [x, y, c] of [[9, 15, '#FF8A1F'], [14, 22, '#B76CFF'], [10, 38, '#5FD068']]) fill(cv, R(cv, x, y, x + 2, y + 2), c)
  fill(cv, R(cv, 15, 36, 22, 43), MAT.paper.b)
  outline(cv, R(cv, 15, 36, 22, 43), M.o)
  drawBat(cv, 16, 38, 1, '#2A1E44')
  saveOffice('fridge', cv, { feet: 64, ax: 3 }, 'Fridge')
}

export function waterCooler() {
  const cv = new Canvas(28, 62)
  castShadow(cv, 4, 22, 56, { depth: 2, shift: 3 })
  cuboid(cv, 4, 26, 22, 56, 4, MAT.white, { bot: 3 })
  for (let x = 7; x <= 19; x++) cv.set(x, 36, MAT.white.s)
  fill(cv, R(cv, 11, 40, 15, 42), MAT.metal.l); fill(cv, R(cv, 11, 44, 15, 46), MAT.trim.l)
  fill(cv, R(cv, 8, 48, 18, 52), MAT.plastic.b)
  for (let x = 8; x <= 18; x++) cv.set(x, 48, MAT.plastic.l)
  // jug
  const jug = E(cv, 13, 14, 8.5, 12).or(R(cv, 8, 24, 18, 27))
  vol(cv, jug, MAT.jug, { rad: 6 })
  for (const [x, y] of [[9, 10], [10, 9], [16, 18], [15, 19], [11, 16]]) cv.set(x, y, '#FFFFFF')
  for (let x = 8; x <= 18; x++) cv.set(x, 12, MAT.jug.s)
  for (let x = 9; x <= 17; x++) cv.set(x, 2, MAT.jug.l)
  saveOffice('water_cooler', cv, { feet: 56, ax: 4 }, 'Water cooler')
}

export function kitchenCounter() {
  const cv = new Canvas(112, 70)
  castShadow(cv, 3, 106, 60, { depth: 3, shift: 4 })
  cuboid(cv, 3, 22, 106, 60, 12, MAT.wood, { grain: 6, bot: 3 })
  // counter doors, handles
  const dy = 36
  for (let x0 = 7; x0 < 100; x0 += 26) {
    for (let x = x0; x <= x0 + 22; x++) { cv.set(x, dy, MAT.wood.s); cv.set(x, dy + 17, MAT.wood.s) }
    for (let y = dy; y <= dy + 17; y++) { cv.set(x0, y, MAT.wood.s); cv.set(x0 + 22, y, MAT.wood.s) }
    for (let x = x0 + 9; x <= x0 + 13; x++) cv.set(x, dy + 4, MAT.metal.l)
  }
  // sink basin
  const sink = R(cv, 60, 25, 82, 30)
  fill(cv, sink, MAT.metal.s)
  for (let x = 60; x <= 82; x++) cv.set(x, 25, MAT.metal.o)
  outline(cv, sink, MAT.metal.o)
  seg(cv, [[71, 24], [71, 19], [75, 19]], MAT.metal.l)
  // coffee machine
  const cm = cuboid(cv, 10, 6, 26, 28, 4, MAT.plastic, { bot: 2 })
  void cm
  fill(cv, R(cv, 13, 12, 23, 18), '#0F3A2A'); for (let x = 14; x <= 20; x++) cv.set(x, 14, GLOW.scrGreenTx)
  cv.set(21, 16, GLOW.ledR)
  fill(cv, R(cv, 15, 20, 21, 26), MAT.white.b)
  for (let x = 15; x <= 21; x++) cv.set(x, 20, MAT.white.h)
  fill(cv, R(cv, 16, 22, 20, 25), '#5A3A28')
  // candy bowl and a small jack-o'-lantern
  drawCandyBowl(cv, 42, 33)
  drawPumpkin(cv, 94, 33, 6)
  drawMug(cv, 33, 32, MAT.paper)
  saveOffice('kitchen_counter', cv, { feet: 60, ax: 3 }, 'Kitchenette counter: coffee machine, sink, candy bowl, jack-o-lantern')
}

export function printer() {
  const cv = new Canvas(46, 54)
  castShadow(cv, 3, 40, 49, { depth: 3, shift: 4 })
  // stand
  cuboid(cv, 4, 30, 39, 49, 4, MAT.cabinet, { bot: 3 })
  for (let y = 36; y <= 46; y++) { cv.set(21, y, MAT.cabinet.s); cv.set(22, y, MAT.cabinet.l) }
  for (const x of [17, 26]) fill(cv, R(cv, x, 39, x + 1, 42), MAT.metal.l)
  // printer on top
  cuboid(cv, 6, 12, 37, 31, 8, MAT.white, { bot: 2 })
  fill(cv, R(cv, 9, 24, 24, 27), '#0F3A2A'); for (let x = 10; x <= 18; x += 2) cv.set(x, 25, GLOW.scrGreenTx)
  cv.set(28, 25, GLOW.ledG); cv.set(31, 25, GLOW.ledA)
  // paper coming out
  fill(cv, R(cv, 12, 8, 26, 13), MAT.paper.b)
  for (let x = 12; x <= 26; x++) cv.set(x, 8, MAT.paper.h)
  for (let x = 14; x <= 22; x += 3) cv.set(x, 10, MAT.paper.s)
  outline(cv, R(cv, 12, 8, 26, 13), MAT.paper.o)
  saveOffice('printer', cv, { feet: 49, ax: 4 }, 'Printer on a stand')
}

export function boxes() {
  const cv = new Canvas(48, 52)
  castShadow(cv, 3, 42, 46, { depth: 3, shift: 4 })
  const tape = (x0, x1, y0, y1) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) cv.set(x, y, MAT.cardboard.h) }
  cuboid(cv, 3, 30, 24, 46, 5, MAT.cardboard, { bot: 2 })
  tape(12, 15, 30, 34)
  cuboid(cv, 25, 33, 42, 46, 5, MAT.cardboard, { bot: 2 })
  tape(32, 35, 33, 37)
  cuboid(cv, 9, 12, 32, 30, 6, MAT.cardboard, { bot: 2 })
  tape(19, 23, 12, 17)
  drawText(cv, 11, 21, 'old', MAT.cardboard.o)
  drawText(cv, 27, 38, 'misc', MAT.cardboard.o)
  fill(cv, R(cv, 28, 20, 30, 24), '#FF8A1F') // a candy-corn bag stuffed in
  saveOffice('boxes', cv, { feet: 46, ax: 3 }, 'Cardboard boxes (stack behind the printer)')
}
