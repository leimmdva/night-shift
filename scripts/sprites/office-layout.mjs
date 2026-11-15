// Single source of truth for the office map: where every piece stands. build-office.mjs renders previews from it
// and writes src/game/maps/office.json.
// Units: tiles (32px) unless a name ends in Px. Props use a floor footprint (x, y, w, h) in tiles; the sprite is
// placed so its floor-contact line (meta `feet`) sits on the bottom edge of the footprint and its body-left (`ax`)
// on the left edge. Fractional values are fine (0.25 = 8px).
export const T = 32
export const COLS = 20
export const ROWS = 14
export const WALL_ROWS = 3 // the back wall's front face is 3 tiles tall; side and bottom walls are half a tile thick

export function buildLayout(S) {
  const props = []
  const wall = []
  const decals = []
  const lights = []
  const hideSpots = []

  const place = (spr, x, y, w, h) => {
    const s = S[spr]
    if (!s) throw new Error(`layout: unknown sprite ${spr}`)
    return [Math.round(x * T) - s.ax, Math.round((y + h) * T) - s.feet]
  }
  const addProp = (id, sprite, x, y, w, h, o = {}) => {
    const [px, py] = place(sprite, x, y, w, h)
    const p = { id, sprite, x, y, w, h, px, py, blocks: o.blocks !== false, kind: o.kind ?? 'prop' }
    props.push(p)
    for (const l of o.lights ?? []) lights.push({ ...l, x: px + l.x, y: py + l.y })
    return p
  }
  const addWall = (id, sprite, px, py, o = {}) => {
    wall.push({ id, sprite, px, py, kind: 'wall' })
    for (const l of o.lights ?? []) lights.push({ ...l, x: px + l.x, y: py + l.y })
  }
  const addDecal = (id, sprite, px, py) => decals.push({ id, sprite, px, py, kind: 'decal' })

  // light recipes (sprite-relative centres)
  const PUMP = { c: [255, 154, 46], rx: 26, ry: 18 }
  const monitor = (c = [96, 170, 255], dx = 33, dy = 30) => ({ x: dx, y: dy, rx: 30, ry: 20, c })
  const AMBER = [232, 163, 61]

  // ---------------- back wall, left to right (pixel positions; the wall face is 96px tall, floor starts at y = 96)
  addWall('window-a', 'window_night_a', 224, 12)
  addWall('whiteboard', 'whiteboard', 308, 24)
  addWall('wall-clock', 'wall_clock', 192, 8)
  addWall('window-b', 'window_night_b', 414, 12)
  addWall('closet-door', 'closet', 490, 34)
  addWall('server-door', 'door_server', 544, 33, { lights: [{ x: 32, y: 34, rx: 16, ry: 12, c: [92, 240, 138] }] })
  addWall('banner', 'banner_halloween', 36, 12)
  for (let i = 0; i < 10; i++) {
    const x0 = 16 + i * 64
    addWall(`string-lights-${i}`, 'string_lights', x0, 8)
    for (const [k, bx] of [8, 24, 40, 56].entries()) {
      const wy = 8 + 1 + Math.round(4 * Math.sin((Math.PI * bx) / 63))
      lights.push({ x: x0 + bx, y: wy + 4, rx: 9, ry: 7, c: k % 2 === 0 ? [255, 179, 71] : [183, 108, 255], small: true })
    }
  }
  addWall('string-window-a', 'string_lights_window', 222, 14)
  addWall('string-window-b', 'string_lights_window', 412, 14)
  addWall('bat-a1', 'bat_a', 232, 36); addWall('bat-b1', 'bat_b', 246, 44); addWall('bat-a2', 'bat_a', 236, 52)
  addWall('bat-b2', 'bat_b', 470, 34); addWall('bat-a3', 'bat_a', 452, 46); addWall('bat-b3', 'bat_b', 424, 38)
  addWall('cat', 'cat_cutout', 158, 14)
  addWall('spider', 'spider_hanging', 528, 6)
  addWall('web-door', 'cobweb_small', 546, 8)

  // ---------------- back-wall furniture (feet at y = 3.75 tiles)
  addProp('fridge', 'fridge', 0.5, 3, 1, 0.75)
  addProp('counter', 'kitchen_counter', 1.5, 3, 3.25, 0.75, { lights: [{ ...PUMP, x: 93, y: 38, rx: 22, ry: 14 }, { x: 14, y: 22, rx: 10, ry: 8, c: [92, 240, 138], small: true }] })
  addProp('water-cooler', 'water_cooler', 4.75, 3, 0.6, 0.75)
  addProp('bookshelf-1', 'bookshelf', 5.45, 3, 1.6, 0.75, { lights: [{ ...PUMP, x: 43, y: 28, rx: 14, ry: 10, small: true }] })
  addProp('credenza', 'credenza', 7.15, 3, 2.6, 0.75, { lights: [{ ...PUMP, x: 74, y: 12, rx: 18, ry: 12 }] })
  addProp('printer', 'printer', 9.9, 3, 1.15, 0.75, { lights: [{ x: 29, y: 25, rx: 8, ry: 6, c: [92, 240, 138], small: true }] })
  addProp('cabinet-1', 'filing_cabinet', 11.1, 3, 0.9, 0.75)
  addProp('cabinet-2', 'filing_cabinet', 12.0, 3, 0.9, 0.75)
  addProp('bookshelf-2', 'bookshelf', 13.4, 3, 1.6, 0.75)

  // ---------------- desks, row A (y = 5). Chairs sit south of each desk.
  addProp('desk-pumpkin', 'desk_pumpkin', 3, 5, 2, 1, { lights: [monitor(), { ...PUMP, x: 56, y: 28, rx: 16, ry: 10 }] })
  addProp('chair-1', 'chair_teal', 3.72, 6, 0.65, 0.7)
  const dSkirt = addProp('desk-skirt', 'desk_skirt', 6, 5, 2, 1, { lights: [monitor(), { ...PUMP, x: 55, y: 28, rx: 14, ry: 9 }] })
  addProp('desk-skeleton', 'desk_skeleton', 9, 5, 2.9, 1, { lights: [monitor([96, 170, 255], 33, 44)] })

  // ---------------- desks, row B (y = 8)
  addDecal('rug-teal', 'rug_teal', 88, 262)
  addProp('desk-witch', 'desk_witch', 3, 8, 2, 1, { lights: [monitor([108, 240, 154], 33, 42)] })
  addProp('chair-2', 'chair_blue', 3.72, 9, 0.65, 0.7)
  addProp('desk-plain', 'desk_plain', 6, 8, 2, 1, { lights: [monitor()] })
  addProp('chair-3', 'chair_teal', 6.72, 9, 0.65, 0.7)

  // ---------------- player's desk (right) with the amber laptop
  const dPlayer = addProp('desk-player', 'desk_player', 15, 7, 2, 1, { lights: [{ x: 33, y: 28, rx: 40, ry: 30, c: AMBER, strong: true }] })
  addProp('chair-player', 'chair_teal', 15.72, 8, 0.65, 0.7)

  // ---------------- meeting table with chairs behind it
  const table = addProp('meeting-table', 'meeting_table', 10, 8, 4.125, 2, { lights: [{ ...PUMP, x: 68, y: 22, rx: 26, ry: 14 }] })
  for (const [i, c] of [10.9, 12.06, 13.22].entries()) addProp(`chair-meet-${i}`, 'chair_front', c - 0.31, 7.5, 0.6, 0.5)

  // ---------------- lounge: plum rug, sofa standing free with a gap behind it
  addDecal('rug-plum', 'rug_plum', 372, 326)
  addDecal('sofa-gap-shadow', 'gap_shadow', 400, 341)
  const sofa = addProp('sofa', 'sofa', 12.5, 11.3, 3.06, 0.9)
  addDecal('pillow-gap', 'wrapper_b', 380, 338)
  addDecal('pillow-gap2', 'wrapper_c', 470, 340)
  addProp('plant-small-2', 'plant_small', 11.6, 11.4, 0.6, 0.6)
  addProp('gravestone', 'gravestone', 15.75, 11.3, 0.7, 0.8)
  const divider = addProp('plant-divider', 'plant_divider', 7, 11, 3.125, 0.9)
  addDecal('rug-brown', 'rug_brown', 64, 142)

  // ---------------- left wall
  const locker = addProp('locker', 'locker', 0.5, 5.2, 1, 0.9)
  const wardrobe = addProp('wardrobe', 'wardrobe', 0.5, 8.2, 1.45, 0.9)
  addProp('plant-1', 'plant_tall', 0.5, 10.6, 0.6, 0.75)

  // ---------------- right wall
  addProp('cabinet-3', 'filing_cabinet', 17.6, 5, 0.9, 0.8)
  addProp('cabinet-4', 'filing_cabinet', 18.5, 5, 0.9, 0.8)
  addProp('printer-2', 'printer', 18.2, 7.2, 1.15, 0.8, { lights: [{ x: 29, y: 25, rx: 8, ry: 6, c: [92, 240, 138], small: true }] })
  addProp('plant-2', 'plant_tall', 18.8, 9.0, 0.6, 0.75)
  const boxes = addProp('boxes', 'boxes', 16.9, 11.4, 1.4, 0.9)
  addProp('boxes-big', 'boxes_big', 18.3, 11.5, 1.2, 0.9)

  // ---------------- entrance (bottom-left)
  addProp('entrance-door', 'door_entrance', 1, 13, 2, 1, { blocks: false, kind: 'door', lights: [{ x: 47, y: 8, rx: 18, ry: 14, c: [76, 224, 138] }] })
  addDecal('doormat', 'doormat', 44, 410)
  addProp('pumpkin-pile', 'pumpkin_pile', 3.3, 12, 1.4, 0.9, { lights: [{ ...PUMP, x: 26, y: 24, rx: 40, ry: 24 }] })
  addProp('plant-small-3', 'plant_small', 13.0, 5.3, 0.6, 0.6)
  addProp('gravestone-2', 'gravestone', 6.7, 12, 0.7, 0.8)
  addProp('sign-mortem', 'sign_mortem', 5.0, 12, 1.1, 0.9)

  // ---------------- floor litter
  for (const [i, [x, y, k]] of [[137, 232, 'a'], [262, 262, 'b'], [356, 188, 'c'], [420, 372, 'a'], [76, 340, 'c'], [585, 232, 'b'], [210, 396, 'a'], [500, 300, 'c'], [300, 150, 'b'], [118, 190, 'a'], [560, 400, 'c'], [330, 330, 'b']].entries()) {
    addDecal(`wrapper-${i}`, `wrapper_${k}`, x, y)
  }

  // ---------------- hiding spots: x,y = the tile the player stands on while hidden, enter = walkable tile next to it
  const bb = (p) => ({ prop: p.id })
  hideSpots.push(
    { id: 'desk-skirt', type: 'under-desk', x: 6, y: 5, enter: { x: 6, y: 6 }, ...bb(dSkirt) },
    { id: 'locker', type: 'locker', x: 1, y: 5, enter: { x: 1, y: 4 }, ...bb(locker) },
    { id: 'supply-closet', type: 'closet', x: 15, y: 3, enter: { x: 15, y: 4 }, prop: 'closet-door' },
    { id: 'sofa', type: 'behind-sofa', x: 14, y: 10, enter: { x: 15, y: 10 }, ...bb(sofa) },
    { id: 'meeting-table', type: 'under-table', x: 11, y: 9, enter: { x: 11, y: 10 }, ...bb(table) },
    { id: 'plant-divider', type: 'behind-plant', x: 8, y: 10, enter: { x: 9, y: 10 }, ...bb(divider) },
    { id: 'boxes', type: 'behind-boxes', x: 18, y: 10, enter: { x: 17, y: 10 }, ...bb(boxes) },
    { id: 'wardrobe', type: 'wardrobe', x: 1, y: 9, enter: { x: 2, y: 9 }, ...bb(wardrobe) },
  )

  const playerDesk = { x: 15, y: 7, w: 2, h: 1, seat: { x: 15, y: 8 }, prop: dPlayer.id }
  const serverDoor = {
    x: 17, y: 0, w: 2, h: 3, prop: 'server-door',
    approach: { x: 17, y: 3 },
    golemSlots: [{ x: 16, y: 4 }, { x: 18, y: 4 }],
    clearZone: { x: 16, y: 3, w: 3, h: 3 },
  }
  const entrance = { x: 1, y: 13, w: 2, h: 1, spawn: { x: 2, y: 12 } }
  const monsterSpawns = [{ x: 1, y: 4 }, { x: 9, y: 4 }, { x: 2, y: 11 }, { x: 9, y: 12 }]

  // ---------------- walkability from footprints (a prop blocks a tile if it covers at least 25% of it)
  const blocked = Array.from({ length: ROWS }, () => Array(COLS).fill(false))
  for (let y = 0; y < WALL_ROWS; y++) blocked[y].fill(true)
  const overlaps = []
  for (const p of props) {
    if (!p.blocks) continue
    for (let cy = 0; cy < ROWS; cy++) for (let cx = 0; cx < COLS; cx++) {
      const ox = Math.min(cx + 1, p.x + p.w) - Math.max(cx, p.x)
      const oy = Math.min(cy + 1, p.y + p.h) - Math.max(cy, p.y)
      if (ox > 0 && oy > 0 && ox * oy >= 0.25) blocked[cy][cx] = true
    }
  }
  // thick side and bottom walls take the outer half tile: treat those border tiles as wall (except the entrance doorway)
  for (let y = 0; y < ROWS; y++) { blocked[y][0] = true; blocked[y][COLS - 1] = true }
  for (let x = 0; x < COLS; x++) if (x !== 1 && x !== 2) blocked[ROWS - 1][x] = true
  const walkable = blocked.map((r) => r.map((b) => !b))
  void overlaps
  return { props, wall, decals, lights, hideSpots, playerDesk, serverDoor, entrance, monsterSpawns, walkable }
}

// Breadth-first reachability over walkable tiles (4-neighbour) from a start tile.
export function reach(walkable, sx, sy) {
  const seen = new Set([`${sx},${sy}`])
  const q = [[sx, sy]]
  while (q.length) {
    const [x, y] = q.shift()
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy
      if (ny < 0 || ny >= walkable.length || nx < 0 || nx >= walkable[0].length) continue
      if (!walkable[ny][nx] || seen.has(`${nx},${ny}`)) continue
      seen.add(`${nx},${ny}`); q.push([nx, ny])
    }
  }
  return seen
}
