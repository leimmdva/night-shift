// Second batch of office pieces for the warm redesign: shelving, storage, rugs, the seated skeleton and Halloween extras.
import {
  Canvas, MAT, GLOW, castShadow, cuboid, face, vol, seg, R, E, P, rnd, outline, fill,
  drawText, textW, saveOffice, putIfEmpty,
} from './office-lib.mjs'
import { drawPumpkin, drawCandyBowl, drawMug, drawBat } from './office-decor.mjs'

const BOOKS = ['#C8402F', '#E8893A', '#3F8A8A', '#8A5CC8', '#E8C94F', '#4A6EA8', '#7BA05A', '#F2E6C8', '#B84A78', '#2E5E4E']
function book(cv, x, yb, w, h, c) {
  const x1 = x + w - 1, y0 = yb - h + 1
  for (let y = y0; y <= yb; y++) for (let xx = x; xx <= x1; xx++) cv.set(xx, y, c)
  const d = (k) => { const n = parseInt(c.slice(1), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('') }
  for (let y = y0; y <= yb; y++) { cv.set(x1, y, d(0.68)) }
  for (let xx = x; xx <= x1; xx++) cv.set(xx, y0, d(1.25))
  if (w >= 3) { cv.set(x + 1, y0 + 2, '#F2E6C8'); if (h > 9) cv.set(x + 1, y0 + 5, '#F2E6C8') }
  cv.set(x, yb, d(0.68))
}
function garland(cv, x0, x1, y) {
  const N = x1 - x0
  for (let x = x0; x <= x1; x++) cv.set(x, y + Math.round(2 * Math.sin((Math.PI * (x - x0)) / N)), '#2A1608')
  let k = 0
  for (let x = x0 + 3; x < x1 - 2; x += 5, k++) {
    const sy = y + 1 + Math.round(2 * Math.sin((Math.PI * (x - x0)) / N))
    const M = k % 2 ? MAT.clothPurple : MAT.trim
    for (let r = 0; r < 5; r++) for (let dx = -2 + Math.floor(r / 2); dx <= 2 - Math.floor(r / 2); dx++) cv.set(x + dx, sy + r, r === 0 ? M.h : dx <= -1 ? M.l : M.b)
    cv.set(x, sy + 5, M.o)
  }
}

export function bookshelf() {
  const cv = new Canvas(60, 92)
  castShadow(cv, 2, 53, 86, { depth: 3, shift: 5 })
  cuboid(cv, 2, 6, 53, 86, 7, MAT.wood, { bot: 3, grain: 2 })
  const inner = R(cv, 6, 15, 49, 80)
  fill(cv, inner, '#2B170C')
  for (let x = 6; x <= 49; x++) { cv.set(x, 15, '#160A04'); cv.set(x, 16, '#3A2012') }
  const rows = [30, 46, 62, 78]
  rows.forEach((py, ri) => {
    for (let x = 6; x <= 49; x++) { cv.set(x, py + 1, MAT.wood.h); cv.set(x, py + 2, MAT.wood.b); cv.set(x, py + 3, MAT.wood.s) }
    let x = 7
    let i = 0
    while (x < 47) {
      const w = 3 + Math.floor(rnd(i, ri, 4) * 3)
      const h = 9 + Math.floor(rnd(i, ri, 5) * 5)
      if (ri === 0 && x > 36) break
      if (rnd(i, ri, 6) < 0.1) { x += 2; i++; continue }
      book(cv, x, py, w, Math.min(h, 13), BOOKS[Math.floor(rnd(i, ri, 7) * BOOKS.length)])
      x += w; i++
    }
  })
  drawPumpkin(cv, 43, 29, 4, { glow: false })
  for (let y = 15; y <= 80; y++) { cv.set(49, y, MAT.wood.s) }
  for (let y = 16; y <= 82; y++) cv.set(6, y, '#1A0C06')
  garland(cv, 4, 51, 14)
  // shadow cast by the carcass on the books (top-left light)
  for (let x = 7; x <= 49; x++) putIfEmpty(cv, x, 17, '#00000000')
  saveOffice('bookshelf', cv, { feet: 86, ax: 2 }, 'Bookshelf with coloured books and a paper garland')
}

export function credenza() {
  const cv = new Canvas(88, 42)
  castShadow(cv, 2, 83, 38, { depth: 3, shift: 5 })
  cuboid(cv, 2, 10, 83, 38, 9, MAT.wood, { grain: 5, bot: 3 })
  for (let k = 0; k < 3; k++) {
    const x0 = 5 + k * 26
    for (let x = x0; x <= x0 + 23; x++) { cv.set(x, 21, MAT.wood.h); cv.set(x, 35, MAT.wood.s) }
    for (let y = 21; y <= 35; y++) { cv.set(x0, y, MAT.wood.l); cv.set(x0 + 23, y, MAT.wood.s) }
    for (let x = x0 + 9; x <= x0 + 14; x++) { cv.set(x, 25, '#E8D8A0'); cv.set(x, 26, '#9A8648') }
  }
  // items on top
  const f = face(cv, 56, 1, 64, 9, MAT.wood)
  void f
  fill(cv, R(cv, 58, 3, 62, 7), '#9AC2D8'); cv.set(60, 5, '#E8E0C8')
  drawMug(cv, 14, 16, MAT.chair)
  drawCandyBowl(cv, 36, 17)
  drawPumpkin(cv, 74, 17, 5)
  saveOffice('credenza', cv, { feet: 38, ax: 2 }, 'Low credenza')
}

export function wardrobe() {
  const cv = new Canvas(54, 94)
  castShadow(cv, 2, 47, 88, { depth: 3, shift: 5 })
  cuboid(cv, 2, 6, 47, 88, 8, MAT.wood, { bot: 3, grain: 6 })
  // crown moulding
  for (let x = 1; x <= 48; x++) { cv.set(x, 14, MAT.wood.h); cv.set(x, 15, MAT.wood.s) }
  // open left door: dark interior with hanging coats
  const inner = R(cv, 7, 19, 24, 80)
  fill(cv, inner, '#160B06')
  for (let y = 19; y <= 80; y++) cv.set(7, y, '#0A0402')
  seg(cv, [[8, 24], [24, 24]], MAT.metal.l)
  for (const [cx, c] of [[12, MAT.clothPurple], [19, MAT.trim]]) {
    const coat = P(cv, [[cx - 3, 28], [cx + 3, 28], [cx + 4, 64], [cx - 4, 64]])
    for (const [x, y] of coat.cells()) cv.set(x, y, x < cx - 1 ? c.l : x > cx + 2 ? c.s : c.b)
    outline(cv, coat, c.o)
    cv.set(cx, 25, MAT.metal.h); cv.set(cx, 26, MAT.metal.l); cv.set(cx - 1, 27, MAT.metal.l); cv.set(cx + 1, 27, MAT.metal.l)
  }
  for (let x = 7; x <= 24; x++) { cv.set(x, 81, MAT.wood.o); cv.set(x, 80, '#2A160C') }
  // swung-out leaf edge on the left, seen at an angle
  const leaf = P(cv, [[3, 18], [7, 20], [7, 80], [3, 83]])
  for (const [x, y] of leaf.cells()) cv.set(x, y, x < 5 ? MAT.wood.l : MAT.wood.b)
  outline(cv, leaf, MAT.wood.o)
  // closed right door
  for (let y = 19; y <= 80; y++) { cv.set(25, y, MAT.wood.o); cv.set(26, y, MAT.wood.h) }
  for (let x = 26; x <= 46; x++) { cv.set(x, 19, MAT.wood.h); cv.set(x, 80, MAT.wood.s) }
  for (let y = 19; y <= 80; y++) cv.set(46, y, MAT.wood.s)
  for (const [y0, y1] of [[24, 48], [53, 76]]) {
    for (let x = 30; x <= 42; x++) { cv.set(x, y0, MAT.wood.s); cv.set(x, y1, MAT.wood.h) }
    for (let y = y0; y <= y1; y++) { cv.set(30, y, MAT.wood.s); cv.set(42, y, MAT.wood.h) }
  }
  fill(cv, R(cv, 28, 50, 29, 52), '#E8D8A0'); cv.set(28, 50, '#FFF3C8')
  // feet
  for (const x of [5, 42]) { fill(cv, R(cv, x, 88, x + 3, 90), MAT.wood.s); outline(cv, R(cv, x, 88, x + 3, 90), MAT.wood.o) }
  drawBat(cv, 32, 30, 0, '#2A1E44')
  saveOffice('wardrobe', cv, { feet: 88, ax: 2 }, 'Big wardrobe with one door open (hiding spot)')
}

// ------------------------------------------------------------------ rugs (floor decals, flat)
function rug(name, w, h, M, B, title) {
  const cv = new Canvas(w, h)
  const all = R(cv, 1, 1, w - 2, h - 2)
  fill(cv, all, M.b)
  for (const [x, y] of all.cells()) if (rnd(x, y, 3) < 0.06) cv.set(x, y, M.l)
  for (let x = 1; x < w - 1; x++) { cv.set(x, 1, M.h); cv.set(x, h - 2, M.s) }
  for (let y = 1; y < h - 1; y++) { cv.set(1, y, M.h); cv.set(w - 2, y, M.s) }
  // border band
  for (let x = 4; x < w - 4; x++) { cv.set(x, 4, B.b); cv.set(x, 5, B.l); cv.set(x, h - 5, B.b); cv.set(x, h - 6, B.l) }
  for (let y = 4; y < h - 4; y++) { cv.set(4, y, B.b); cv.set(5, y, B.l); cv.set(w - 5, y, B.b); cv.set(w - 6, y, B.l) }
  // diamond pattern
  for (let x = 12; x < w - 12; x += 10) {
    const cy = Math.floor(h / 2)
    for (let k = -3; k <= 3; k++) { cv.set(x + k, cy - (3 - Math.abs(k)), B.b); cv.set(x + k, cy + (3 - Math.abs(k)), B.b) }
    cv.set(x, cy, B.h)
  }
  outline(cv, all, M.o)
  // fringe on the short ends
  for (let y = 4; y < h - 4; y += 2) { cv.set(0, y, M.l); cv.set(w - 1, y, M.l) }
  saveOffice(name, cv, { feet: h, ax: 0 }, title)
}
export function rugs() {
  rug('rug_plum', 150, 66, MAT.clothPurple, MAT.trim, 'Plum rug with orange border')
  rug('rug_teal', 140, 62, { h: '#6FC7B8', l: '#4FA89C', b: '#3A8C84', s: '#2A6A68', o: '#10302E' }, { h: '#F6E7B5', l: '#E8D49A', b: '#D0B978', s: '#A89355', o: '#6A5A30' }, 'Teal rug with cream border')
  rug('rug_brown', 96, 52, { h: '#C7845C', l: '#A96B46', b: '#8A5236', s: '#693A26', o: '#2A130A' }, { h: '#F2C46E', l: '#E3A94A', b: '#C98A30', s: '#9A6420', o: '#4A2A0C' }, 'Brown runner rug')
}

// ------------------------------------------------------------------ Halloween extras
export function pumpkinPile() {
  const cv = new Canvas(54, 46)
  castShadow(cv, 4, 48, 42, { depth: 3, shift: 4 })
  drawPumpkin(cv, 15, 42, 10)
  drawPumpkin(cv, 37, 42, 9)
  drawPumpkin(cv, 26, 30, 8)
  saveOffice('pumpkin_pile', cv, { feet: 42, ax: 4 }, 'Pile of carved pumpkins')
}
export function catCutout() {
  const cv = new Canvas(24, 26)
  const K = '#17101F', K2 = '#2A1E3A'
  const body = E(cv, 12, 18, 7, 7).or(E(cv, 12, 9, 5, 4.6))
  fill(cv, body, K)
  fill(cv, P(cv, [[7.5, 7], [8, 1.5], [11, 5]]), K)
  fill(cv, P(cv, [[16.5, 7], [16, 1.5], [13, 5]]), K)
  for (const [x, y] of body.cells()) if (!body.has(x - 1, y) || !body.has(x, y - 1)) cv.set(x, y, K2)
  seg(cv, [[18, 22], [21, 19], [21, 14], [19, 11]], K)
  seg(cv, [[19, 22], [22, 19], [22, 14]], K)
  for (const x of [10, 14]) { cv.set(x, 9, GLOW.pumpkinFace); cv.set(x, 10, GLOW.pumpkinEdge) }
  for (const x of [9, 15]) seg(cv, [[x, 11], [x - 2, 11]], K2)
  // tape
  for (const [x, y] of [[8, 1], [16, 1], [4, 24], [20, 24]]) { fill(cv, R(cv, x, y, x + 2, y + 1), '#E8DDB0') }
  saveOffice('cat_cutout', cv, { feet: 26, ax: 0 }, 'Black cat cut-out')
}
export function signMortem() {
  const cv = new Canvas(40, 44)
  castShadow(cv, 6, 33, 40, { depth: 2, shift: 3 })
  for (const x of [8, 29]) { fill(cv, R(cv, x, 28, x + 2, 40), MAT.wood.s); outline(cv, R(cv, x, 28, x + 2, 40), MAT.wood.o) }
  const b = face(cv, 4, 4, 35, 31, MAT.wood)
  void b
  fill(cv, R(cv, 7, 7, 32, 28), '#1C1428')
  outline(cv, R(cv, 7, 7, 32, 28), '#0A0612')
  for (let x = 7; x <= 32; x++) cv.set(x, 7, '#3A2E50')
  drawText(cv, 20 - Math.floor(textW('mortem') / 2), 10, 'mortem', MAT.trim.h)
  drawText(cv, 20 - Math.floor(textW('labs') / 2), 17, 'labs', '#C9A6F0')
  for (let x = 12; x <= 28; x++) cv.set(x, 24, MAT.trim.b)
  saveOffice('sign_mortem', cv, { feet: 40, ax: 4 }, 'MORTEM LABS standing sign')
}
export function boxesBig() {
  // taller second stack for the right wall
  const cv = new Canvas(44, 56)
  castShadow(cv, 3, 40, 52, { depth: 3, shift: 4 })
  const M = MAT.cardboard
  cuboid(cv, 3, 34, 24, 52, 5, M, { bot: 2 })
  cuboid(cv, 22, 38, 40, 52, 5, M, { bot: 2 })
  cuboid(cv, 8, 16, 30, 34, 6, M, { bot: 2 })
  cuboid(cv, 11, 4, 26, 16, 5, M, { bot: 1 })
  for (const [x, y, w] of [[11, 34, 4], [27, 38, 4], [16, 16, 4], [17, 4, 3]]) for (let i = 0; i < w; i++) for (let j = 0; j < 4; j++) cv.set(x + i, y + j, M.h)
  drawText(cv, 11, 24, 'xmas', M.o)
  drawText(cv, 24, 44, 'nov', M.o)
  saveOffice('boxes_big', cv, { feet: 52, ax: 3 }, 'Tall stack of cardboard boxes')
}

// Soft dark band on the floor right behind the sofa's backrest: makes the gap behind it read from above.
export function gapShadow() {
  const cv = new Canvas(100, 9)
  for (let y = 0; y < 9; y++) for (let x = 0; x < 100; x++) {
    if (y < 8 - Math.floor(Math.abs(x - 50) / 25)) cv.set(x, y, y > 5 ? '#2A140A44' : '#2A140A77')
  }
  saveOffice('gap_shadow', cv, { feet: 9, ax: 0 }, 'Floor shadow behind the sofa')
}
