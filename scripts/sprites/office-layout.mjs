// Single source of truth for the office map: where every piece stands. build-office.mjs renders previews from it
// and writes src/game/maps/office.json.
// Units: tiles (32px) unless a name ends in Px. Props use a floor footprint (x, y, w, h) in tiles; the sprite is
// placed so its floor-contact line (meta `feet`) sits on the bottom edge of the footprint and its body-left (`ax`)
// on the left edge. Fractional values are fine (0.25 = 8px).
export const T = 32
export const COLS = 20
export const ROWS = 14
export const WALL_ROWS = 2 // the back wall's front face is 2 tiles tall

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

  // ---------------- back wall, left to right (pixel positions)
  addWall('window-a', 'window_night_a', 182, 10)
  addWall('whiteboard', 'whiteboard', 231, 24)
  addWall('wall-clock', 'wall_clock', 338, 26)
  addWall('window-b', 'window_night_b', 370, 10)
  addWall('closet-door', 'closet', 423, 4)
  addWall('server-door', 'door_server', 544, 0, { lights: [{ x: 32, y: 34, rx: 16, ry: 12, c: [92, 240, 138] }] })
  addWall('banner', 'banner_halloween', 232, 8)
  for (let i = 0; i < COLS / 2; i++) {
    const x0 = i * 64
    addWall(`string-lights-${i}`, 'string_lights', x0, 5)
    for (const [k, bx] of [8, 24, 40, 56].entries()) {
      const wy = 5 + 1 + Math.round(4 * Math.sin((Math.PI * bx) / 63))
      lights.push({ x: x0 + bx, y: wy + 4, rx: 9, ry: 7, c: k % 2 === 0 ? [255, 179, 71] : [183, 108, 255], small: true })
    }
  }
  addWall('string-window-a', 'string_lights_window', 176, 10)
  addWall('string-window-b', 'string_lights_window', 364, 10)
  addWall('bat-a1', 'bat_a', 190, 22); addWall('bat-b1', 'bat_b', 205, 32); addWall('bat-a2', 'bat_a', 193, 38)
  addWall('bat-b2', 'bat_b', 394, 20); addWall('bat-a3', 'bat_a', 381, 30); addWall('bat-b3', 'bat_b', 399, 38)
  addWall('spider', 'spider_hanging', 359, 12)
  addWall('web-tl', 'cobweb_corner', 8, 6)
  addWall('web-door', 'cobweb_small', 547, 8)

  // ---------------- kitchenette (back-left)
  addProp('fridge', 'fridge', 0.5, 2, 1, 0.75)
  addProp('counter', 'kitchen_counter', 1.5, 2, 3.25, 0.75, { lights: [{ ...PUMP, x: 93, y: 38, rx: 22, ry: 14 }, { x: 14, y: 22, rx: 10, ry: 8, c: [92, 240, 138], small: true }] })
  addProp('water-cooler', 'water_cooler', 4.75, 2, 0.6, 0.75)
  addProp('plant-1', 'plant_tall', 5.45, 2, 0.6, 0.75)
  addProp('plant-2', 'plant_tall', 10.95, 2, 0.6, 0.75)

  // ---------------- desk row 1 (y = 5)
  addProp('desk-pumpkin', 'desk_pumpkin', 2, 5, 2, 1, { lights: [monitor(), { ...PUMP, x: 56, y: 28, rx: 16, ry: 10 }] })
  addProp('desk-witch', 'desk_witch', 5, 5, 2, 1, { lights: [monitor([108, 240, 154], 33, 42)] })
  addProp('desk-plain', 'desk_plain', 8, 5, 2, 1, { lights: [monitor()] })
  addProp('chair-1', 'chair_teal', 2.72, 6, 0.65, 0.7)
  addProp('chair-2', 'chair_blue', 5.72, 6, 0.65, 0.7)
  addProp('chair-skeleton', 'chair_skeleton', 8.56, 6.75, 0.8, 0.9)

  // ---------------- desk row 2 (y = 9)
  const dSkirt = addProp('desk-skirt', 'desk_skirt', 2, 9, 2, 1, { lights: [monitor(), { ...PUMP, x: 55, y: 28, rx: 14, ry: 9 }] })
  const dPlayer = addProp('desk-player', 'desk_player', 5, 9, 2, 1, { lights: [{ x: 33, y: 28, rx: 40, ry: 30, c: AMBER, strong: true }] })
  addProp('chair-player', 'chair_teal', 5.72, 10, 0.65, 0.7)

  // ---------------- desk right (y = 8)
  addProp('desk-right', 'desk_pumpkin', 15, 8, 2, 1, { lights: [monitor(), { ...PUMP, x: 56, y: 28, rx: 16, ry: 10 }] })
  addProp('chair-right', 'chair_blue', 15.72, 9, 0.65, 0.7)

  // ---------------- meeting table with chairs behind it
  const table = addProp('meeting-table', 'meeting_table', 9.5, 8, 4.125, 2, { lights: [{ ...PUMP, x: 68, y: 22, rx: 26, ry: 14 }] })
  for (const [i, c] of [10.4, 11.56, 12.72].entries()) addProp(`chair-meet-${i}`, 'chair_front', c - 0.31, 7.45, 0.6, 0.55)

  // ---------------- lounge and divider (front)
  const divider = addProp('plant-divider', 'plant_divider', 7.5, 12, 3.125, 0.9)
  const sofa = addProp('sofa', 'sofa', 14.5, 12, 3.06, 0.9)
  addProp('gravestone', 'gravestone', 18.1, 12, 0.7, 0.8)
  addProp('plant-small-1', 'plant_small', 13.55, 12.15, 0.6, 0.6)
  addProp('plant-small-2', 'plant_small', 0.45, 11, 0.6, 0.6)

  // ---------------- left and right walls
  const locker = addProp('locker', 'locker', 0.5, 7, 1, 0.9)
  addProp('cabinet-1', 'filing_cabinet', 17.7, 5, 0.9, 0.9)
  addProp('cabinet-2', 'filing_cabinet', 18.6, 5, 0.9, 0.9)
  addProp('printer', 'printer', 18.6, 8, 1.12, 1, { lights: [{ x: 29, y: 25, rx: 8, ry: 6, c: [92, 240, 138], small: true }] })
  const boxes = addProp('boxes', 'boxes', 18.45, 7, 1.25, 0.7)

  // ---------------- entrance (bottom-left)
  addProp('entrance-door', 'door_entrance', 1, 13, 2, 1, { blocks: false, kind: 'door', lights: [{ x: 47, y: 8, rx: 18, ry: 14, c: [76, 224, 138] }] })
  addDecal('doormat', 'doormat', 38, 376)
  addProp('pumpkin-entrance', 'pumpkin_l', 3.1, 12.3, 0.75, 0.6, { lights: [{ ...PUMP, x: 17, y: 20, rx: 36, ry: 24 }] })

  // ---------------- floor litter
  for (const [i, [x, y, k]] of [[137, 232, 'a'], [262, 262, 'b'], [356, 188, 'c'], [420, 372, 'a'], [76, 340, 'c'], [585, 262, 'b'], [210, 396, 'a'], [500, 300, 'c'], [300, 120, 'b'], [118, 150, 'a']].entries()) {
    addDecal(`wrapper-${i}`, `wrapper_${k}`, x, y)
  }

  // ---------------- hiding spots: x,y = the tile the player stands on while hidden, enter = walkable tile next to it
  const bb = (p) => ({ prop: p.id })
  hideSpots.push(
    { id: 'desk-skirt', type: 'under-desk', x: 2, y: 9, enter: { x: 2, y: 10 }, ...bb(dSkirt) },
    { id: 'locker', type: 'locker', x: 1, y: 7, enter: { x: 1, y: 8 }, ...bb(locker) },
    { id: 'supply-closet', type: 'closet', x: 14, y: 2, enter: { x: 14, y: 3 }, prop: 'closet-door' },
    { id: 'sofa', type: 'behind-sofa', x: 15, y: 11, enter: { x: 15, y: 10 }, ...bb(sofa) },
    { id: 'meeting-table', type: 'under-table', x: 11, y: 9, enter: { x: 11, y: 10 }, ...bb(table) },
    { id: 'plant-divider', type: 'behind-plant', x: 9, y: 11, enter: { x: 9, y: 10 }, ...bb(divider) },
    { id: 'printer-boxes', type: 'behind-boxes', x: 18, y: 7, enter: { x: 17, y: 7 }, ...bb(boxes) },
  )

  const playerDesk = { x: 5, y: 9, w: 2, h: 1, seat: { x: 6, y: 10 }, prop: dPlayer.id }
  const serverDoor = {
    x: 17, y: 0, w: 2, h: 2, prop: 'server-door',
    approach: { x: 17, y: 2 },
    golemSlots: [{ x: 16, y: 3 }, { x: 18, y: 3 }],
    clearZone: { x: 15, y: 2, w: 5, h: 3 },
  }
  const entrance = { x: 1, y: 13, w: 2, h: 1, spawn: { x: 2, y: 12 } }
  const monsterSpawns = [{ x: 7, y: 3 }, { x: 16, y: 6 }, { x: 12, y: 12 }, { x: 4, y: 7 }]

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
