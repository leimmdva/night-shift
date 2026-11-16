import Phaser from 'phaser'
import { officeMap, type RoomMap } from '../world/officeMap'
import { lightBand, BAND_STRENGTH } from '../world/lighting'
import { moveWithCollision, tileCenter } from '../world/collision'
import { nearestHideSpot, canOpenLaptop, interactResult, type PlayerMode } from '../world/hiding'
import type { HideSpot } from '../world/officeMap'
import type { HudScene } from './HudScene'
import { lockedCue, caughtCue } from '../../audio/cues'
import type { BugPack } from '../../types/BugPack'
import { newRun, onSolved, onCaught, type RunState } from '../../state/runState'
import { save } from '../../state/checkpoint'
import { nextBug } from '../flow/queue'
import { pickSpawns, firstSpawnDelay, distanceToDesk } from '../flow/spawner'
import { createMonster, hasMonster } from '../monsters/factory'
import type { MonsterActor, Facing } from '../monsters/MonsterActor'
import { isCatchable } from '../world/hiding'

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

  /** Player state (game-flow design, "Hiding and laptop gating"). */
  mode: PlayerMode = 'walking'
  hideSpot: HideSpot | null = null
  /** The hide spot used last; the checkpoint after a catch. */
  lastHideSpot: HideSpot | null = null
  laptopOpen = false
  protected hud!: HudScene
  private interactKey!: Phaser.Input.Keyboard.Key
  private laptopKey!: Phaser.Input.Keyboard.Key

  run!: RunState
  actor: MonsterActor | null = null
  activePack: BugPack | null = null
  /** time.now at which the next monster spawns */
  spawnAt = Infinity
  spawnInfo: { tx: number; ty: number; deskDistance: number; atMs: number } | null = null
  protected catching = false
  protected graceUntil = 0
  private beam!: Phaser.GameObjects.Graphics
  private startedAt = 0

  create(): void {
    this.drawRoom()
    this.createPlayer()
    this.setupCamera()
    this.run = newRun({ room: 'office', x: this.map.entrance.spawn.x, y: this.map.entrance.spawn.y })
    this.startedAt = this.time.now
    this.spawnAt = this.time.now + firstSpawnDelay()
    this.beam = this.add.graphics().setDepth(190_000)
    this.game.events.on('laptop:closed', this.onLaptopClosed, this)
    this.game.events.on('laptop:solved', this.onLaptopSolved, this)
    this.game.events.on('laptop:hint', this.onLaptopHint, this)
    this.events.once('shutdown', () => {
      this.game.events.off('laptop:closed', this.onLaptopClosed, this)
      this.game.events.off('laptop:solved', this.onLaptopSolved, this)
      this.game.events.off('laptop:hint', this.onLaptopHint, this)
    })
    this.scene.launch('HudScene')
    this.hud = this.scene.get('HudScene') as HudScene
    const kb = this.input.keyboard!
    this.interactKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.laptopKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.L)
    this.interactKey.on('down', () => this.onInteract())
    this.laptopKey.on('down', () => this.onLaptopKey())
  }

  /** Read-only snapshot for tests and debugging; exposed as window.__ns by the room that is running. */
  debugState(): Record<string, unknown> {
    const t = this.map.grid.tile
    return {
      mode: this.mode,
      hideSpot: this.hideSpot?.id ?? null,
      laptopOpen: this.laptopOpen,
      facing: this.facing,
      player: { x: this.player.x, y: this.player.y, tx: Math.floor(this.player.x / t), ty: Math.floor((this.player.y - 4) / t) },
      prompt: this.promptText(),
      deaths: this.run.deaths,
      solved: this.run.solved,
      hintLevels: this.run.hintLevels,
      spawnInDueMs: Math.round(this.spawnAt - this.time.now),
      spawnInfo: this.spawnInfo,
      catching: this.catching,
      autopsyOpen: this.hud?.cardOpen ?? false,
      monster: this.actor && !this.actor.gone
        ? { x: this.actor.x, y: this.actor.y, state: this.actor.state, alpha: this.actor.sprite.alpha, dissolving: this.actor.dissolving, dist: Math.hypot(this.actor.x - this.player.x, this.actor.y - this.player.y) }
        : null,
    }
  }

  /** Overridden by rooms that have monsters: is there an active bug to fix? */
  protected hasActiveBug(): boolean {
    return !!this.actor && !this.actor.dissolving && !this.actor.gone
  }

  protected onInteract(): void {
    if (this.hud?.cardOpen || performance.now() - this.hud.lastClosedAt < 250 || this.catching) return
    const near = nearestHideSpot(this.map, this.player.x, this.player.y)
    const action = interactResult(this.mode, this.laptopOpen, near)
    if (action === 'hide' && near) this.enterHide(near)
    else if (action === 'leave') this.leaveHide()
  }

  protected onLaptopKey(): void {
    if (this.laptopOpen || this.hud?.cardOpen) return
    if (!canOpenLaptop(this.mode, this.hasActiveBug())) {
      if (this.mode === 'walking') lockedCue()
      return
    }
    this.openLaptop()
  }

  protected openLaptop(): void {
    const pack = this.activePack
    if (!pack) return
    this.laptopOpen = true
    this.hud.setPrompt(null)
    this.scene.launch('LaptopScene', { pack, hintLevel: this.run.hintLevels[pack.id] ?? 0 })
  }

  private onLaptopClosed(): void {
    this.laptopOpen = false
  }

  private onLaptopHint(level: number): void {
    const pack = this.activePack
    if (!pack) return
    const cur = this.run.hintLevels[pack.id] ?? 0
    if (level > cur) this.run = { ...this.run, hintLevels: { ...this.run.hintLevels, [pack.id]: Math.min(3, level) as 1 | 2 | 3 } }
  }

  /** All tests passed in the laptop: save, dissolve the monster, show the autopsy card. */
  private onLaptopSolved(): void {
    const pack = this.activePack
    if (!pack || !this.actor) return
    const spot = this.hideSpot ?? this.lastHideSpot
    this.run = onSolved(this.run, pack.id, spot ? { room: 'office', x: spot.enter.x, y: spot.enter.y } : undefined)
    save(this.run)
    this.laptopOpen = false
    const actor = this.actor
    this.activePack = null
    this.spawnAt = Infinity
    actor.dissolve(1500, () => {
      this.actor = null
      this.hud.showAutopsy(pack, () => {})
    })
  }

  // ── monsters ──────────────────────────────────────────────────────────────
  spawnMonster(pack: BugPack): void {
    const tile = pickSpawns(this.map, { x: Math.floor(this.player.x / 32), y: Math.floor((this.player.y - 4) / 32) }, 1)[0]
    const c = tileCenter(this.map, tile.x, tile.y)
    const actor = createMonster(this, this.map, pack, c, this.player, () => this.catchPlayer())
    if (!actor) return
    this.actor = actor
    this.activePack = pack
    this.spawnInfo = { tx: tile.x, ty: tile.y, deskDistance: distanceToDesk(this.map, tile), atMs: Math.round(this.time.now - this.startedAt) }
  }

  /** The monster touched the player (AI catch or contact check). Hidden players are never caught. */
  protected catchPlayer(): void {
    if (this.catching || !isCatchable(this.mode) || this.time.now < this.graceUntil || !this.actor || !this.activePack) return
    this.catching = true
    caughtCue()
    const pack = this.activePack
    const actor = this.actor
    const cam = this.cameras.main
    cam.flash(200, 255, 255, 255)
    this.player.anims.stop()
    actor.ai.defeated = true // freeze: monsters hold still while the screen goes white and black
    actor.sprite.body && (actor.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0)
    this.time.delayedCall(700, () => cam.fadeOut(500, 0, 0, 0))
    cam.once('camerafadeoutcomplete', () => {
      this.run = onCaught(this.run, pack.id)
      save(this.run)
      const spot = this.lastHideSpot
      const wake = spot ? tileCenter(this.map, spot.enter.x, spot.enter.y) : tileCenter(this.map, this.map.entrance.spawn.x, this.map.entrance.spawn.y)
      this.player.setPosition(wake.x, wake.y - (spot ? 0 : 8))
      // never wake up inside the monster: it resumes from where it was unless that is right on top of the player
      if (actor.gone === false && Math.hypot(actor.x - wake.x, actor.y - wake.y) < 140) {
        const t = pickSpawns(this.map, { x: Math.floor(wake.x / 32), y: Math.floor((wake.y - 4) / 32) }, 1)[0]
        const c = tileCenter(this.map, t.x, t.y)
        actor.sprite.setPosition(c.x, c.y)
      }
      actor.ai.defeated = false
      actor.ai.transitionTo('PATROL')
      this.graceUntil = this.time.now + 2500
      cam.fadeIn(500, 0, 0, 0)
      this.catching = false
      this.hud.toast('Sudo: "You know where to find the fix."', 3200)
    })
  }

  private drawBeam(): void {
    const g = this.beam
    g.clear()
    if (this.mode !== 'walking' || this.catching) return
    const ang = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[this.facing]
    const px = this.player.x, py = this.player.y - 12
    const R = 120, half = 0.62
    g.fillStyle(0xfff2b0, 0.12)
    g.beginPath()
    g.moveTo(px, py)
    for (let i = 0; i <= 8; i++) {
      const a = ang - half + (2 * half * i) / 8
      g.lineTo(px + Math.cos(a) * R, py + Math.sin(a) * R)
    }
    g.closePath().fillPath()
  }

  enterHide(spot: HideSpot): void {
    this.mode = 'hidden'
    this.hideSpot = spot
    this.lastHideSpot = spot
    this.player.setVisible(false)
    this.player.anims.stop()
    this.hud.setHidden(true)
  }

  leaveHide(): void {
    const spot = this.hideSpot
    this.mode = 'walking'
    this.hideSpot = null
    if (spot) {
      const c = tileCenter(this.map, spot.enter.x, spot.enter.y)
      this.player.setPosition(c.x, c.y)
    }
    this.player.setVisible(true)
    this.hud.setHidden(false)
  }

  /** Prompt text for the current situation, or null. */
  protected promptText(): string | null {
    if (this.hud.cardOpen || this.laptopOpen) return null
    if (this.mode === 'hidden') return this.hasActiveBug() ? 'E — leave\nL — laptop' : 'E — leave'
    return nearestHideSpot(this.map, this.player.x, this.player.y) ? 'E — hide' : null
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
    if (!this.hud) return
    const frozen = this.catching
    if (this.mode === 'walking' && !this.hud.cardOpen && !frozen) this.movePlayer(delta)
    else this.player.anims.stop()
    ;(this.player as unknown as { isHiding: boolean }).isHiding = this.mode === 'hidden'

    // spawn the next monster of the queue when its time has come
    if (!this.actor && !this.hud.cardOpen) {
      const next = nextBug(this.run.solved, this.run.cut)
      if (next && hasMonster(next) && this.time.now >= this.spawnAt) this.spawnMonster(next)
    }
    if (this.actor) {
      this.actor.update(delta, this.player, this.facing as Facing, this.mode === 'hidden')
      // contact catch, independent of the AI state
      if (this.hasActiveBug() && Math.hypot(this.actor.x - this.player.x, this.actor.y - this.player.y) < 20) this.catchPlayer()
    }
    this.drawBeam()
    this.hud.setPrompt(this.promptText())
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
