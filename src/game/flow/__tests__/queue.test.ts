import { describe, it, expect } from 'vitest'
import { nextBug, QUEUE } from '../queue'

describe('nextBug', () => {
  it('returns pack 01 when nothing is solved', () => {
    expect(nextBug([])?.id).toBe('null-ghost')
  })
  it('returns pack 02 when 01 is solved', () => {
    expect(nextBug(['null-ghost'])?.id).toBe('off-by-one')
  })
  it('returns null when everything is solved', () => {
    expect(nextBug(QUEUE.map((p) => p.id))).toBeNull()
  })
  it('skips cut packs', () => {
    expect(nextBug(['null-ghost'], ['off-by-one'])?.id).toBe('infinite-crawler')
  })
})
