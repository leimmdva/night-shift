import { describe, it, expect } from 'vitest'
import { newRun, onSolved } from '../runState'
import { toSave, parseSave, save, load, clear, SAVE_KEY } from '../checkpoint'

const mem = () => {
  const m = new Map<string, string>()
  return { setItem: (k: string, v: string) => void m.set(k, v), getItem: (k: string) => m.get(k) ?? null, removeItem: (k: string) => void m.delete(k), m }
}

describe('checkpoint', () => {
  const run = onSolved(newRun({ room: 'office', x: 2, y: 12 }, 1000), 'null-ghost', { room: 'office', x: 1, y: 4 })

  it('round-trips a run and lists the solved pack under both names', () => {
    const s = mem()
    save(run, s)
    expect(JSON.parse(s.m.get(SAVE_KEY)!).solvedBugIds).toEqual(['null-ghost'])
    expect(load(s)).toEqual(run)
  })
  it('adds the checkpoint-spec fields', () => {
    expect(toSave(run).checkpointBugId).toBe('null-ghost')
  })
  it('ignores a corrupt, partial or mistyped save', () => {
    expect(parseSave(null)).toBeNull()
    expect(parseSave('{not json')).toBeNull()
    expect(parseSave('{}')).toBeNull()
    expect(parseSave(JSON.stringify({ ...run, deaths: 'x' }))).toBeNull()
    expect(parseSave(JSON.stringify({ ...run, hintLevels: { a: 9 } }))).toBeNull()
  })
  it('clear removes the save', () => {
    const s = mem()
    save(run, s)
    clear(s)
    expect(load(s)).toBeNull()
  })
})
