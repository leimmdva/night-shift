import type Phaser from 'phaser'
import type { BugPack } from '../../types/BugPack'
import type { RoomMap } from '../world/officeMap'
import { MonsterActor, type ActorOptions } from './MonsterActor'
import { MonsterAI } from '../ai/MonsterAI'
import { nullGhostConfig } from '../ai/MonsterBehaviours'
import { lineOfSight, nextStep } from '../world/nav'
import { tileCenter } from '../world/collision'

const ACTORS: Record<string, ActorOptions> = {
  'null-ghost': { sprite: 'null-ghost', fileLabel: 'profile.js', height: 48, feetY: 44, conditionalAlpha: true },
}

/** Patrol loop for the office in tile coordinates; chosen on open floor so the loop covers the whole room. */
const OFFICE_LOOP = [[9, 4], [17, 6], [17, 10], [9, 10], [2, 10], [2, 6]]

/** Packs that have a monster in the game so far. */
export function hasMonster(pack: BugPack): boolean {
  return pack.id in ACTORS
}

export function createMonster(
  scene: Phaser.Scene, map: RoomMap, pack: BugPack, spawn: { x: number; y: number },
  player: Phaser.GameObjects.Sprite, onCatch: () => void
): MonsterActor | null {
  const opts = ACTORS[pack.id]
  if (!opts) return null
  const actor = new MonsterActor(scene, map, opts, spawn.x, spawn.y)
  const waypoints = OFFICE_LOOP.map(([x, y]) => tileCenter(map, x, y))
  // start the loop at the waypoint nearest the spawn
  const start = waypoints.reduce((b, w, i) => (Math.hypot(w.x - spawn.x, w.y - spawn.y) < Math.hypot(waypoints[b].x - spawn.x, waypoints[b].y - spawn.y) ? i : b), 0)
  const ordered = [...waypoints.slice(start), ...waypoints.slice(0, start)]
  const config = {
    ...nullGhostConfig(ordered, onCatch),
    navigate: (from: { x: number; y: number }, to: { x: number; y: number }) => nextStep(map, from, to),
    lineOfSight: (a: { x: number; y: number }, b: { x: number; y: number }) => lineOfSight(map, a, b),
  }
  actor.ai = new MonsterAI(scene, actor.sprite, player, config)
  return actor
}
