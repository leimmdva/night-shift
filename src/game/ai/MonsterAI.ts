/**
 * MonsterAI.ts
 * erasableSyntaxOnly — no constructor parameter shorthand, no abstract.
 */

import Phaser from 'phaser'
import type { StateKey, MonsterContext, BaseState } from './MonsterState'
import { PatrolState, AlertState, ChaseState, SearchState } from './MonsterState'

export interface MonsterAIConfig {
  waypoints: { x: number; y: number }[]
  detectionRadius?: number
  chaseSpeed?: number
  onCatch?: () => void
  walls?: Phaser.Physics.Arcade.StaticGroup
  /** Next point to walk to when going from `from` to `to` (path around furniture); null = no path. */
  navigate?: (from: { x: number; y: number }, to: { x: number; y: number }) => { x: number; y: number } | null
  /** Line-of-sight test on the room's tile grid; replaces the wall-group check when given. */
  lineOfSight?: (a: { x: number; y: number }, b: { x: number; y: number }) => boolean
}

type WithBody = { body: Phaser.Physics.Arcade.Body }
type MonsterGO = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform
type PlayerGO  = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform

export class MonsterAI {
  scene: Phaser.Scene
  monster: MonsterGO
  player: PlayerGO
  config: MonsterAIConfig
  states: Record<StateKey, BaseState>
  current: BaseState
  currentKey: StateKey
  defeated: boolean

  constructor(
    scene: Phaser.Scene,
    monster: MonsterGO,
    player: PlayerGO,
    config: MonsterAIConfig
  ) {
    this.scene = scene
    this.monster = monster
    this.player = player
    this.config = config
    this.defeated = false

    const ctx = this.buildContext()
    const dr = config.detectionRadius ?? 180
    const cs = config.chaseSpeed ?? 90

    this.states = {
      PATROL: new PatrolState(ctx, dr),
      ALERT:  new AlertState(ctx),
      CHASE:  new ChaseState(ctx, cs),
      SEARCH: new SearchState(ctx),
    }

    this.currentKey = 'PATROL'
    this.current = this.states.PATROL
    this.current.enter()
  }

  update(delta: number): void {
    if (this.defeated) return
    this.current.update(delta)
  }

  defeat(): void {
    this.defeated = true
    this.current.exit()
    const body = (this.monster as unknown as WithBody).body
    body?.setVelocity(0)
  }

  destroy(): void {
    this.defeat()
    this.monster.destroy()
  }

  get state(): StateKey {
    return this.currentKey
  }

  transitionTo(key: StateKey): void {
    this.current.exit()
    this.currentKey = key
    this.current = this.states[key]
    this.current.enter()
  }

  buildContext(): MonsterContext {
    const self = this
    return {
      moveTo(x: number, y: number, speed: number): void {
        const body = (self.monster as unknown as WithBody).body
        if (!body) return
        const next = self.config.navigate?.({ x: self.monster.x, y: self.monster.y }, { x, y }) ?? { x, y }
        const angle = Math.atan2(next.y - self.monster.y, next.x - self.monster.x)
        body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)
      },
      stop(): void {
        const body = (self.monster as unknown as WithBody).body
        body?.setVelocity(0)
      },
      position() {
        return { x: self.monster.x, y: self.monster.y }
      },
      playerPosition() {
        return { x: self.player.x, y: self.player.y }
      },
      distanceToPlayer(): number {
        return Math.hypot(self.player.x - self.monster.x, self.player.y - self.monster.y)
      },
      canSeePlayer(): boolean {
        if (self.config.lineOfSight) {
          return self.config.lineOfSight({ x: self.monster.x, y: self.monster.y }, { x: self.player.x, y: self.player.y })
        }
        if (!self.config.walls) return true
        const steps = 12
        for (let i = 1; i < steps; i++) {
          const t = i / steps
          const rx = self.monster.x + (self.player.x - self.monster.x) * t
          const ry = self.monster.y + (self.player.y - self.monster.y) * t
          const hit = self.config.walls.getChildren().some((wall) => {
            const w = wall as Phaser.GameObjects.Rectangle
            return rx >= w.x - w.width / 2 && rx <= w.x + w.width / 2
                && ry >= w.y - w.height / 2 && ry <= w.y + w.height / 2
          })
          if (hit) return false
        }
        return true
      },
      playerIsHiding(): boolean {
        return (self.player as unknown as { isHiding?: boolean }).isHiding === true
      },
      transition(to: StateKey): void {
        self.transitionTo(to)
      },
      emit(event: string, data?: unknown): void {
        if (event === 'player-caught') {
          self.config.onCatch?.()
        } else {
          self.scene.events.emit(event, data)
        }
      },
      waypoints() {
        return self.config.waypoints
      },
      now(): number {
        return self.scene.time.now
      },
    }
  }
}
