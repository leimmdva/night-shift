import Phaser from 'phaser'
import { officeMap } from '../world/officeMap'

export const FONT = '"Press Start 2P"'

/** Sprite names of the office map, from office.json plus the fixed wall pieces. */
export function officeSpriteNames(): string[] {
  const names = new Set<string>(['wall_top_h', 'wall_top_v', 'wall_corner', 'cobweb_corner'])
  const m = officeMap
  m.tiles.floor.forEach((n) => names.add(n))
  names.add(m.tiles.wallFront)
  m.tiles.wallTop.forEach((n) => names.add(n))
  for (const l of [m.wall, m.props, m.decals]) l.forEach((e) => names.add(e.sprite))
  return [...names]
}

/** UI kit pieces used by the slice (public/sprites/ui/). */
export const UI_PIECES = [
  'panel', 'pill', 'button-beige-normal', 'button-beige-pressed', 'button-purple-normal',
  'button-purple-pressed', 'button-tan-normal', 'button-tan-pressed', 'button-tan-disabled', 'more-arrow',
]

export const MONSTER_SPRITES = ['null-ghost']

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload(): void {
    const t = this.add
      .text(480, 270, 'LOADING', { fontFamily: FONT, fontSize: '12px', color: '#c9d1d9' })
      .setOrigin(0.5)
    this.load.on('progress', (p: number) => t.setText(`LOADING ${Math.round(p * 100)}%`))
    for (const n of officeSpriteNames()) this.load.image(`office/${n}`, `/sprites/office/${n}.png`)
    for (const n of UI_PIECES) this.load.image(`ui/${n}`, `/sprites/ui/${n}.png`)
    for (const n of MONSTER_SPRITES) this.load.image(`monster/${n}`, `/sprites/monsters/${n}.png`)
    this.load.image('player', '/sprites/player/player.png')
    this.load.json('ui-kit', '/sprites/ui/ui.json')
  }

  create(): void {
    // The pixel font must be ready before any text is drawn, or Phaser bakes the fallback font into the texture.
    void document.fonts.load(`12px ${FONT}`).then(() => this.scene.start('OfficeScene'))
  }
}
