import Phaser from 'phaser'

export const FONT = '"Press Start 2P"'
/** Every UI element is drawn at 2x so its pixels match the 2x world zoom. */
export const UI_SCALE = 2
export const INK = '#2E1E26'

interface KitEntry { w: number; h: number; slice?: [number, number, number, number] }

/** A 9-slice piece of the UI kit (public/sprites/ui/ui.json), sized in unscaled pixels and drawn at UI_SCALE. */
export function nineSlice(
  scene: Phaser.Scene, piece: string, x: number, y: number, w: number, h: number
): Phaser.GameObjects.NineSlice {
  const kit = scene.cache.json.get('ui-kit') as Record<string, KitEntry>
  const [l, t, r, b] = kit[piece]?.slice ?? [8, 8, 8, 8]
  return scene.add.nineslice(x, y, `ui/${piece}`, undefined, w, h, l, r, t, b).setScale(UI_SCALE)
}

export function uiText(
  scene: Phaser.Scene, x: number, y: number, text: string, o: { color?: string; wrap?: number; align?: string } = {}
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: FONT,
      fontSize: '8px',
      color: o.color ?? INK,
      lineSpacing: 6,
      align: o.align ?? 'left',
      wordWrap: o.wrap ? { width: o.wrap, useAdvancedWrap: true } : undefined,
    })
    .setScale(UI_SCALE)
}

/** A button from the kit with a label; calls onClick on release. */
export function kitButton(
  scene: Phaser.Scene, x: number, y: number, w: number, label: string,
  colour: 'purple' | 'tan' | 'beige', onClick: () => void
): Phaser.GameObjects.Container {
  const h = 24
  const bg = nineSlice(scene, `button-${colour}-normal`, 0, 0, w, h)
  const labelColour = colour === 'purple' ? '#F4EAFB' : INK
  const text = uiText(scene, 0, 0, label, { color: labelColour }).setOrigin(0.5)
  const c = scene.add.container(x, y, [bg, text]).setSize(w * UI_SCALE, h * UI_SCALE)
  c.setInteractive({ useHandCursor: true })
  c.on('pointerdown', () => { bg.setTexture(`ui/button-${colour}-pressed`); text.y = UI_SCALE })
  const up = () => { bg.setTexture(`ui/button-${colour}-normal`); text.y = 0 }
  c.on('pointerout', up)
  c.on('pointerup', () => { up(); onClick() })
  return c
}
