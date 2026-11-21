import { describe, it, expect } from 'vitest'
import intro from '../intro.json'

const EXPRESSIONS: Record<string, string[]> = {
  BOSS: ['neutral', 'stern'], // portraits boss.png, boss-stern.png
  YOU: ['neutral', 'worried'], // portraits player.png, player-worried.png
}

describe('intro dialogue draft', () => {
  it('has 6 to 10 lines', () => {
    expect(intro.lines.length).toBeGreaterThanOrEqual(6)
    expect(intro.lines.length).toBeLessThanOrEqual(10)
  })

  it('gives every line a speaker, an expression and text', () => {
    for (const [i, line] of intro.lines.entries()) {
      expect(['BOSS', 'YOU'], `line ${i + 1} speaker`).toContain(line.speaker)
      expect(EXPRESSIONS[line.speaker], `line ${i + 1} expression`).toContain(line.expression)
      expect(line.text.trim().length, `line ${i + 1} text`).toBeGreaterThan(0)
    }
  })

  it('alternates BOSS and YOU, starts and ends with the boss', () => {
    intro.lines.forEach((line, i) => expect(line.speaker).toBe(i % 2 === 0 ? 'BOSS' : 'YOU'))
    expect(intro.lines.at(-1)?.speaker).toBe('BOSS')
  })

  it('ends with the boss leaving and the lights going off', () => {
    const last = intro.lines.at(-1) as { after?: string[] }
    expect(last.after).toEqual(['boss-leaves', 'lights-off'])
  })

  it('fits the dialogue bar (four lines of 24 characters) and avoids exclamation marks', () => {
    for (const line of intro.lines) {
      expect(line.text.length).toBeLessThanOrEqual(90)
      expect(line.text).not.toContain('!')
    }
  })
})
