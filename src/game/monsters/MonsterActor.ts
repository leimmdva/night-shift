import Phaser from 'phaser'
import { MonsterAI } from '../ai/MonsterAI'
import { isInViewCone } from '../ai/behaviourUtils'
import type { RoomMap } from '../world/officeMap'
import { canStand } from '../world/collision'

export type Facing = 'down' | 'up' | 'left' | 'right'
const FACING_ANGLE: Record<Facing, number> = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }

export interface ActorOptions {
  /** texture key without the "monster/" prefix */
  sprite: string
  fileLabel: string
  /** pixel size of the sprite and the y of its floor-contact line (shadow centre) */
  height: number
  feetY: number
  /** Null Ghost: alpha 0.4, full alpha inside the player's view cone */
  conditionalAlpha?: boolean
}

/** A monster in the world: sprite + file label + MonsterAI + wall collision + dissolve. */
export class MonsterActor {
  scene: Phaser.Scene
  map: RoomMap
  sprite: Phaser.GameObjects.Sprite
  label: Phaser.GameObjects.Text
  ai!: MonsterAI
  opts: ActorOptions
  dissolving = false
  gone = false
  private prev: { x: number; y: number }

  constructor(scene: Phaser.Scene, map: RoomMap, opts: ActorOptions, x: number, y: number) {
    this.scene = scene
    this.map = map
    this.opts = opts
    this.sprite = scene.add.sprite(x, y, `monster/${opts.sprite}`).setOrigin(0.5, opts.feetY / opts.height)
    scene.physics.add.existing(this.sprite)
    ;(this.sprite.body as Phaser.Physics.Arcade.Body).setSize(16, 8).setOffset(16, opts.feetY - 8)
    this.label = scene.add
      .text(x, y, opts.fileLabel, { fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#ff5a5a', stroke: '#1a0a10', strokeThickness: 3 })
      .setOrigin(0.5, 1)
      .setDepth(150_000)
    this.prev = { x, y }
    this.sprite.setAlpha(opts.conditionalAlpha ? 0.4 : 1)
  }

  get x(): number { return this.sprite.x }
  get y(): number { return this.sprite.y }
  get state(): string { return this.ai.state }

  /** Per-frame update. `playerFacing` drives the view cone; `playerVisible` is false while hidden. */
  update(delta: number, player: Phaser.GameObjects.Sprite, playerFacing: Facing, playerHidden: boolean): void {
    if (this.gone) return
    if (!this.dissolving) this.ai.update(delta)

    // wall collision: keep the old coordinate on an axis that would leave walkable ground
    const s = this.sprite
    if (!canStand(this.map, s.x, s.y, { props: false, halfW: 6, depth: 4 })) {
      const okX = canStand(this.map, s.x, this.prev.y, { props: false, halfW: 6, depth: 4 })
      const okY = canStand(this.map, this.prev.x, s.y, { props: false, halfW: 6, depth: 4 })
      s.x = okX ? s.x : this.prev.x
      s.y = okY ? s.y : this.prev.y
      if (!okX && !okY) { s.x = this.prev.x; s.y = this.prev.y }
    }
    const body = s.body as Phaser.Physics.Arcade.Body
    if (body.velocity.x < -1) s.setFlipX(false)
    else if (body.velocity.x > 1) s.setFlipX(true)
    this.prev = { x: s.x, y: s.y }

    if (this.opts.conditionalAlpha && !this.dissolving) {
      const range = 190
      const near = Math.hypot(s.x - player.x, s.y - player.y) <= range
      const inCone = !playerHidden && near &&
        isInViewCone({ x: player.x, y: player.y - 12 }, FACING_ANGLE[playerFacing], 0.62, { x: s.x, y: s.y - 14 })
      s.setAlpha(inCone ? 1 : 0.4)
    }
    s.setDepth(10 + s.y)
    this.label.setPosition(s.x, s.y - this.opts.feetY - 2 + (this.opts.height - this.opts.feetY) * 0)
    this.label.setAlpha(this.dissolving ? this.sprite.alpha : 1)
  }

  /** Dissolve: fill in to full alpha, then fade out and rise over `ms` (1.5 s). */
  dissolve(ms: number, done: () => void): void {
    if (this.dissolving) return
    this.dissolving = true
    this.ai.defeat()
    const fill = Math.round(ms * 0.3)
    this.scene.tweens.add({
      targets: this.sprite, alpha: 1, duration: fill,
      onComplete: () => {
        this.sprite.setTintFill(0xffffff)
        this.scene.tweens.add({
          targets: [this.sprite, this.label], alpha: 0, y: '-=10', duration: ms - fill, ease: 'Sine.easeIn',
          onUpdate: () => this.label.setPosition(this.sprite.x, this.sprite.y - this.opts.feetY - 2),
          onComplete: () => { this.destroy(); done() },
        })
      },
    })
    this.scene.tweens.add({ targets: this.sprite, scaleX: 1.08, scaleY: 1.08, duration: fill, yoyo: true })
  }

  destroy(): void {
    this.gone = true
    this.sprite.destroy()
    this.label.destroy()
  }
}
