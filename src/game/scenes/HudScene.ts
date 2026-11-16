import Phaser from 'phaser'
import type { BugPack } from '../../types/BugPack'
import { nineSlice, uiText, kitButton, INK, UI_SCALE } from '../ui/kit'

/**
 * HudScene — everything drawn in screen space on top of the room: the interaction prompt, the hidden vignette,
 * short messages and the autopsy card. Runs next to the room scene; the room calls its methods.
 */
export class HudScene extends Phaser.Scene {
  private prompt?: Phaser.GameObjects.Container
  private promptText = ''
  private vignette!: Phaser.GameObjects.Image
  private toastBox?: Phaser.GameObjects.Container
  private card?: Phaser.GameObjects.Container
  private cardOnClose?: () => void
  cardOpen = false
  /** performance.now() of the last card close; the room ignores E for a moment after it. */
  lastClosedAt = -1000

  constructor() {
    super({ key: 'HudScene' })
  }

  create(): void {
    this.makeVignette()
    this.vignette = this.add.image(0, 0, 'vignette').setOrigin(0, 0).setAlpha(0).setDepth(1)
    const dismiss = () => this.closeCard()
    for (const k of ['E', 'ENTER', 'SPACE']) this.input.keyboard!.addKey(k).on('down', dismiss)
  }

  /** Banded dark edges, so the hidden state reads as "peeking out of a hiding spot". */
  private makeVignette(): void {
    if (this.textures.exists('vignette')) return
    const W = 960, H = 540, B = 6
    const tex = this.textures.createCanvas('vignette', W, H)!
    const ctx = tex.getContext()
    const data = ctx.createImageData(W, H)
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const bx = Math.floor(x / B) * B + B / 2, by = Math.floor(y / B) * B + B / 2
      const d = Math.hypot((bx - W / 2) / (W / 2), (by - H / 2) / (H / 2))
      const a = d < 0.55 ? 0.18 : d < 0.7 ? 0.38 : d < 0.85 ? 0.58 : 0.78
      const i = (y * W + x) * 4
      data.data[i] = 6; data.data[i + 1] = 8; data.data[i + 2] = 20; data.data[i + 3] = Math.round(a * 255)
    }
    ctx.putImageData(data, 0, 0)
    tex.refresh()
  }

  setHidden(hidden: boolean): void {
    this.tweens.add({ targets: this.vignette, alpha: hidden ? 1 : 0, duration: 250 })
  }

  /** Shows a one- or two-line prompt in the UI kit dialog style at the bottom of the screen; null hides it. */
  setPrompt(text: string | null): void {
    if (text === this.promptText) return
    this.promptText = text ?? ''
    this.prompt?.destroy()
    this.prompt = undefined
    if (!text) return
    const label = uiText(this, 0, 0, text, { color: INK, align: 'center' }).setOrigin(0.5)
    const w = Math.ceil(label.width) + 20
    const h = Math.ceil(label.height) + 16
    const bg = nineSlice(this, 'panel', 0, 0, w, h)
    this.prompt = this.add.container(480, 540 - h * UI_SCALE / 2 - 16, [bg, label]).setDepth(5)
  }

  toast(text: string, ms = 2400): void {
    this.toastBox?.destroy()
    const label = uiText(this, 0, 0, text, { color: INK, align: 'center', wrap: 300 }).setOrigin(0.5)
    const w = Math.ceil(label.width) + 20
    const h = Math.ceil(label.height) + 16
    const bg = nineSlice(this, 'panel', 0, 0, w, h)
    const box = this.add.container(480, 40 + h, [bg, label]).setDepth(6)
    this.toastBox = box
    this.time.delayedCall(ms, () => {
      this.tweens.add({ targets: box, alpha: 0, duration: 300, onComplete: () => box.destroy() })
    })
  }

  /** Autopsy card: what happened, impact, the right approach. Closes with E, Enter, Space or the button. */
  showAutopsy(pack: BugPack, onClose: () => void): void {
    this.closeCard(false)
    const strip = (s: string) => s.replace(/`/g, '')
    const wrap = 380
    const parts = [pack.autopsy.what, pack.autopsy.impact, pack.autopsy.fix].map(strip)
    const texts = parts.map((p) => uiText(this, 0, 0, p, { wrap }).setOrigin(0, 0))
    const gap = 12
    const bodyH = texts.reduce((a, t) => a + t.height + gap, -gap)
    const title = uiText(this, 0, 0, pack.monster.name.toUpperCase() + ' - ' + pack.monster.fileLabel, { color: '#6B3FA0' })
    const w = wrap + 40
    const h = Math.ceil(bodyH) + 30 + 34 + 24
    const bg = nineSlice(this, 'panel', 0, 0, w, h)
    const left = -w * UI_SCALE / 2 + 20 * UI_SCALE
    let y = -h * UI_SCALE / 2 + 18 * UI_SCALE
    title.setPosition(left, y)
    y += 20 * UI_SCALE
    const items: Phaser.GameObjects.GameObject[] = [bg, title]
    texts.forEach((t) => {
      t.setPosition(left, y)
      items.push(t)
      y += (t.height + gap) * UI_SCALE
    })
    const btn = kitButton(this, 0, h * UI_SCALE / 2 - 24 * UI_SCALE, 70, 'OK', 'purple', () => this.closeCard())
    items.push(btn)
    const card = this.add.container(480, 270, items).setDepth(20).setAlpha(0)
    this.tweens.add({ targets: card, alpha: 1, duration: 250 })
    this.card = card
    this.cardOnClose = onClose
    this.cardOpen = true
  }

  private closeCard(callback = true): void {
    if (!this.card) return
    this.card.destroy()
    this.card = undefined
    this.cardOpen = false
    this.lastClosedAt = performance.now()
    const cb = this.cardOnClose
    this.cardOnClose = undefined
    if (callback) cb?.()
  }
}
