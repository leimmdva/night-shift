import Phaser from 'phaser'
import { mountEditor } from '../../editor/monacoLoader'
import { runCode } from '../../worker/codeRunner'
import type { BugPack } from '../../types/BugPack'
import { nineSlice, uiText, kitButton } from '../ui/kit'
import { passCue, failCue } from '../../audio/cues'

type Editor = Awaited<ReturnType<typeof mountEditor>>

/** DOM boxes in game coordinates (the canvas is 960 x 540). */
const EDITOR_BOX = { x: 64, y: 96, w: 580, h: 300 }
const OUTPUT_BOX = { x: 656, y: 96, w: 240, h: 300 }

/**
 * LaptopScene — the code editor on top of the room. The room scene is NOT paused, so the world keeps running.
 * Launch: scene.launch('LaptopScene', { pack, hintLevel }).
 * Events on game.events: 'laptop:hint' (level), 'laptop:solved' (pack id), 'laptop:closed'.
 */
export class LaptopScene extends Phaser.Scene {
  private pack!: BugPack
  private hintLevel = 0
  private editorBox!: HTMLDivElement
  private outputEl!: HTMLDivElement
  private editor: Editor | null = null
  private closed = false
  private running = false
  private solved = false
  private onResize = (): void => this.layout()
  private onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') { e.preventDefault(); this.closeLaptop() }
  }

  constructor() {
    super({ key: 'LaptopScene' })
  }

  init(data: { pack: BugPack; hintLevel?: number }): void {
    this.pack = data.pack
    this.hintLevel = data.hintLevel ?? 0
    this.closed = false
    this.running = false
    this.solved = false
    this.editor = null
  }

  create(): void {
    this.input.keyboard!.disableGlobalCapture() // let Monaco receive W, A, S, D, E and L
    this.add.rectangle(480, 270, 960, 540, 0x05070d, 0.82)
    nineSlice(this, 'panel', 480, 270, 450, 262)
    uiText(this, 64, 46, this.pack.monster.fileLabel, { color: '#6B3FA0' })
    uiText(this, 896, 46, 'ESC — close', { color: '#7a6a70' }).setOrigin(1, 0)

    kitButton(this, 168, 444, 100, 'RUN TESTS', 'purple', () => void this.runTests())
    kitButton(this, 338, 444, 60, 'HINT', 'tan', () => this.showHint())
    kitButton(this, 480, 444, 60, 'CLOSE', 'beige', () => this.closeLaptop())

    this.editorBox = document.createElement('div')
    this.editorBox.id = 'monaco-container'
    Object.assign(this.editorBox.style, {
      position: 'fixed', zIndex: '10', border: '2px solid #2E1E26', overflow: 'hidden', background: '#0d1117',
    })
    this.editorBox.innerHTML = '<div style="color:#8b949e;font:12px monospace;padding:16px">Laptop booting…</div>'

    this.outputEl = document.createElement('div')
    this.outputEl.id = 'test-output'
    Object.assign(this.outputEl.style, {
      position: 'fixed', zIndex: '10', border: '2px solid #2E1E26', background: '#0d1117', color: '#8b949e',
      fontFamily: 'monospace', padding: '8px', overflowY: 'auto', whiteSpace: 'pre-wrap', boxSizing: 'border-box',
    })
    this.outputEl.textContent = 'Run tests to see results.'
    document.body.append(this.editorBox, this.outputEl)
    this.layout()
    window.addEventListener('resize', this.onResize)
    window.addEventListener('keydown', this.onKey, true)

    // hints already granted (one per catch) are shown straight away
    for (let i = 0; i < this.hintLevel; i++) this.appendSudo(this.pack.hints[i])

    void mountEditor(this.editorBox, this.pack.brokenCode).then((ed) => {
      if (this.closed) { ed.dispose(); return }
      this.editor = ed
      this.layout()
      ed.focus()
    })
  }

  /** Places the DOM boxes over the canvas, whatever size the browser scaled it to. */
  private layout(): void {
    const r = this.game.canvas.getBoundingClientRect()
    const k = r.width / 960
    const place = (el: HTMLElement, b: { x: number; y: number; w: number; h: number }) => {
      Object.assign(el.style, {
        left: `${r.left + b.x * k}px`, top: `${r.top + b.y * k}px`, width: `${b.w * k}px`, height: `${b.h * k}px`,
      })
    }
    place(this.editorBox, EDITOR_BOX)
    place(this.outputEl, OUTPUT_BOX)
    this.outputEl.style.fontSize = `${Math.max(10, Math.round(11 * k))}px`
    this.editor?.updateOptions({ fontSize: Math.max(11, Math.round(13 * k)) })
  }

  private appendSudo(text: string): void {
    const el = document.createElement('div')
    el.style.cssText = 'color:#f0b24a;margin-top:8px'
    el.textContent = `Sudo: ${text}`
    this.outputEl.appendChild(el)
    this.outputEl.scrollTop = this.outputEl.scrollHeight
  }

  private showHint(): void {
    if (this.hintLevel >= this.pack.hints.length) {
      this.appendSudo("I've told you everything I know.")
      return
    }
    this.appendSudo(this.pack.hints[this.hintLevel])
    this.hintLevel++
    this.game.events.emit('laptop:hint', this.hintLevel)
  }

  private async runTests(): Promise<void> {
    if (!this.editor || this.running || this.solved) return
    this.running = true
    this.outputEl.style.color = '#8b949e'
    this.outputEl.textContent = 'Running…'
    const result = await runCode(this.editor.getValue(), this.pack.testCode)
    this.running = false
    if (this.closed) return

    if (result.error && result.error !== 'timeout') {
      failCue()
      this.outputEl.style.color = '#f85149'
      this.outputEl.textContent = `Error:\n${result.error}`
      return
    }
    this.outputEl.style.color = '#c9d1d9'
    this.outputEl.textContent = result.output
    if (result.passed) {
      passCue()
      this.solved = true
      const ok = document.createElement('div')
      ok.style.cssText = 'color:#3fb950;margin-top:12px'
      ok.textContent = 'All tests pass.'
      this.outputEl.appendChild(ok)
      const banner = uiText(this, 480, 410, 'ALL TESTS PASS', { color: '#2f7d3b' }).setOrigin(0.5)
      this.tweens.add({ targets: banner, alpha: 0.4, duration: 300, yoyo: true, repeat: 2 })
      this.time.delayedCall(1300, () => {
        this.game.events.emit('laptop:solved', this.pack.id)
        this.closeLaptop()
      })
    } else {
      failCue()
      this.outputEl.style.color = '#f2c1c1'
    }
  }

  private closeLaptop(): void {
    if (this.closed) return
    this.closed = true
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('keydown', this.onKey, true)
    this.editor?.dispose()
    this.editor = null
    this.editorBox.remove()
    this.outputEl.remove()
    this.input.keyboard!.enableGlobalCapture()
    this.game.events.emit('laptop:closed')
    this.scene.stop()
  }
}
