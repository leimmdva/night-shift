import { RoomScene } from './RoomScene'
import { tileCenter } from '../world/collision'

declare global {
  interface Window { __ns?: { state: () => Record<string, unknown>; teleport?: (tx: number, ty: number) => void; spawnNow?: () => void; monsterTo?: (tx: number, ty: number) => void } }
}

/** The one-room office. Map, props and hide spots come from src/game/maps/office.json. */
export class OfficeScene extends RoomScene {
  constructor() {
    super({ key: 'OfficeScene' })
  }

  create(): void {
    super.create()
    window.__ns = { state: () => this.debugState() }
    if (import.meta.env.DEV) {
      window.__ns.teleport = (tx, ty) => {
        const c = tileCenter(this.map, tx, ty)
        this.player.setPosition(c.x, c.y)
      }
      window.__ns.spawnNow = () => { this.spawnAt = this.time.now }
      window.__ns.monsterTo = (tx, ty) => {
        const c = tileCenter(this.map, tx, ty)
        this.actor?.sprite.setPosition(c.x, c.y)
      }
    }
  }
}
