import { describe, it, expect } from 'vitest'
import { newRun, onSolved, onCaught, actOf } from '../runState'

const start = { room: 'office' as const, x: 2, y: 12 }

describe('actOf', () => {
  it('maps pack order to act', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(actOf)).toEqual([1, 1, 2, 2, 2, 3, 3, 4])
  })
})

describe('onSolved', () => {
  it('adds the pack once and moves the checkpoint', () => {
    const s = onSolved(newRun(start), 'null-ghost', { room: 'office', x: 1, y: 4 })
    const again = onSolved(s, 'null-ghost')
    expect(again.solved).toEqual(['null-ghost'])
    expect(again.checkpoint).toEqual({ room: 'office', x: 1, y: 4 })
  })
  it('does not mutate its input', () => {
    const s = newRun(start)
    onSolved(s, 'x')
    expect(s.solved).toEqual([])
  })
})

describe('onCaught', () => {
  it('counts the death and gives one hint level, capped at 3', () => {
    let s = newRun(start)
    for (let i = 0; i < 5; i++) s = onCaught(s, 'null-ghost')
    expect(s.deaths).toBe(5)
    expect(s.hintLevels['null-ghost']).toBe(3)
  })
  it('keeps solved bugs solved', () => {
    const s = onCaught(onSolved(newRun(start), 'a'), 'b')
    expect(s.solved).toEqual(['a'])
  })
})
