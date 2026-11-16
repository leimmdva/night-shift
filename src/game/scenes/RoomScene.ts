import Phaser from 'phaser'
import { officeMap, type RoomMap } from '../world/officeMap'
import { lightBand, BAND_STRENGTH } from '../world/lighting'
import { moveWithCollision, tileCenter } from '../world/collision'

const T = 32
const WALL_T = 16
const hash = (x: number, y: number): number => {
  let h = Math.imul((x * 73856093) ^ (y * 19349663), 2654435761)
  h ^= h >>> 15
  return (h >>> 0) / 4294967296
}

/** Owns the map, the player, the camera and the monsters of one room. OfficeScene supplies the map. */
export class RoomScene extends Phaser.Scene {
  map: RoomMap = officeMap

  player!: Phaser.GameObjects.Sprite
  facing: 'down' | 'up' | 'left' | 'right' = 'down'
  protected keys!: {
    up: Phaser.Input.Keyboard.Key[]; down: Phaser.Input.Keyboard.Key[]
    left: Phaser.Input.Keyboard.Key[]; right: Phaser.Input.Keyboard.Key[]
  }

  /** Walking speed in px/s (about 2.8 tiles per second). */
  static readonly SPEED = 90
  /** Whole-number camera zoom, so every world pixel is drawn as a 2x2 block. */
  static readonly ZOOM = 2

  create(): void {
    this.drawRoom()
    this.createPlayer()
    this.setupCamera()
  }

  protected createPlayer(): void {
    const sheet = this.textures.get('player')
    for (let i = 0; i < 9; i++) sheet.add(i, 0, i * 32, 0, 32, 36)
    const mk = (key: string, frames: number[]) => this.anims.exists(key) || this.anims.create({
      key, frames: frames.map((f) => ({ key: 'player', frame: f })), frameRate: 8, repeat: -1,
    })
    mk('walk-down', [1, 0, 2, 0]); mk('walk-up', [4, 3, 5, 3]); mk('walk-side', [7, 6, 8, 6])
    const s = tileCenter(this.map, this.map.entrance.spawn.x, this.map.entrance.spawn.y)
    this.player = this.add.sprite(s.x, s.y - 8, 'player', 0).setOrigin(0.5, 32 / 36)
    const kb = this.input.keyboard!
    const K = Phaser.Input.Keyboard.KeyCodes
    this.keys = {
      up: [kb.addKey(K.W), kb.addKey(K.UP)], down: [kb.addKey(K.S), kb.addKey(K.DOWN)],
      left: [kb.addKey(K.A), kb.addKey(K.LEFT)], right: [kb.addKey(K.D), kb.addKey(K.RIGHT)],
    }
  }

  protected setupCamera(): void {
    const cam = this.cameras.main
    cam.setZoom(RoomScene.ZOOM)
    cam.setBounds(0, 0, this.map.grid.widthPx, this.map.grid.heightPx)
    cam.startFollow(this.player, true, 0.2, 0.2)
    cam.setRoundPixels(true)
  }

  /** Reads the movement keys and moves the player. Returns true when the player moved. */
  protected movePlayer(delta: number): boolean {
    const down = (ks: Phaser.Input.Keyboard.Key[]) => ks.some((k) => k.isDown)
    let dx = (down(this.keys.right) ? 1 : 0) - (down(this.keys.left) ? 1 : 0)
    let dy = (down(this.keys.down) ? 1 : 0) - (down(this.keys.up) ? 1 : 0)
    const moving = dx !== 0 || dy !== 0
    if (moving) {
      const len = Math.hypot(dx, dy)
      const step = (RoomScene.SPEED * delta) / 1000
      dx = (dx / len) * step; dy = (dy / len) * step
      const r = moveWithCollision(this.map, this.player.x, this.player.y, dx, dy)
      this.player.setPosition(r.x, r.y)
      if (Math.abs(dx) > Math.abs(dy) + 0.001) this.facing = dx > 0 ? 'right' : 'left'
      else if (dy !== 0) this.facing = dy > 0 ? 'down' : 'up'
    }
    const dir = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing
    this.player.setFlipX(this.facing === 'left')
    if (moving) this.player.anims.play(`walk-${dir}`, true)
    else {
      this.player.anims.stop()
      this.player.setFrame(dir === 'down' ? 0 : dir === 'up' ? 3 : 6)
    }
    this.player.setDepth(10 + this.player.y)
    return moving
  }

  update(_time: number, delta: number): void {
    this.movePlayer(delta)
  }

  /** Draws floor, walls, props and decals in the same order as scripts/sprites/office-compose.mjs. */
  drawRoom(): void {
    const m = this.map
    const { cols, rows } = m.grid
    const W = m.grid.widthPx
    const H = m.grid.heightPx
    const img = (x: number, y: number, name: string, depth: number) =>
      this.add.image(x, y, `office/${name}`).setOrigin(0, 0).setDepth(depth)

    for (let ty = m.grid.wallRows; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
      const r = hash(tx, ty)
      let n = (tx + ty) % 2 === 0 ? 'floor_a' : 'floor_b'
      if (r < 0.14) n = 'floor_worn'
      else if (r > 0.95) n = 'floor_stain'
      img(tx * T, ty * T, n, 0)
    }
    for (let tx = 0; tx < cols; tx++) img(tx * T, 0, m.tiles.wallFront, 1)

    // soft wall shadows on the floor (light from the top-left)
    const g = this.add.graphics().setDepth(2)
    g.fillStyle(0x2a160c, 120 / 255).fillRect(WALL_T, 96, W - 2 * WALL_T, 5)
    g.fillStyle(0x2a160c, 64 / 255).fillRect(WALL_T, 101, W - 2 * WALL_T, 3)
    g.fillStyle(0x2a160c, 30 / 255).fillRect(WALL_T, 104, W - 2 * WALL_T, 2)
    g.fillStyle(0x2a160c, 100 / 255).fillRect(WALL_T, 96, 5, H - 96 - WALL_T)
    g.fillStyle(0x2a160c, 50 / 255).fillRect(WALL_T + 5, 96, 3, H - 96 - WALL_T)

    for (const w of m.wall) img(w.px, w.py, w.sprite, 3)
    for (const d of m.decals) img(d.px, d.py, d.sprite, 4)
    for (const p of m.props) {
      if (p.id === 'entrance-door') continue
      img(p.px, p.py, p.sprite, 10 + (p.y + p.h) * T)
    }

    const top = 100_000
    for (let y = 0; y < H; y += T) {
      img(0, y, 'wall_top_v', top)
      img(W - WALL_T, y, 'wall_top_v', top).setFlipX(true)
    }
    for (let tx = 0; tx < cols; tx++) if (tx < 1 || tx > 2) img(tx * T, H - WALL_T, 'wall_top_h', top)
    for (const [x, y] of [[0, 0], [W - WALL_T, 0], [0, H - WALL_T], [W - WALL_T, H - WALL_T]]) img(x, y, 'wall_corner', top)
    const door = m.props.find((p) => p.id === 'entrance-door')
    if (door) img(door.px, door.py, door.sprite, top)
    img(WALL_T, 8, 'cobweb_corner', top + 1)
    this.add.image(W - WALL_T, 8, 'office/cobweb_corner').setOrigin(1, 0).setFlipX(true).setDepth(top + 1)

    this.drawLights(W, H)
  }

  /** Warm tint + banded light pools, built once into a canvas texture. */
  private drawLights(W: number, H: number): void {
    const tint = this.add.rectangle(0, 0, W, H, 0xfffbe6).setOrigin(0, 0).setDepth(200_000)
    tint.setBlendMode(Phaser.BlendModes.MULTIPLY)
    const tex = this.textures.createCanvas('office-lights', W, H)!
    const ctx = tex.getContext()
    const data = ctx.createImageData(W, H)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = BAND_STRENGTH[lightBand(x, y)]
      if (k === 0) continue
      const i = (y * W + x) * 4
      data.data[i] = 255; data.data[i + 1] = 238; data.data[i + 2] = 200; data.data[i + 3] = Math.round(k * 255)
    }
    ctx.putImageData(data, 0, 0)
    tex.refresh()
    this.add.image(0, 0, 'office-lights').setOrigin(0, 0).setDepth(200_001)
  }
}
