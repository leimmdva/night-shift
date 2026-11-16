/**
 * checkpoint.ts — save and load of the run (localStorage `night-shift-save`). Pure data in and out, no Phaser.
 * The saved JSON is the RunState plus the field names from the checkpoint spec (`solvedBugIds`, `checkpointBugId`,
 * `deathCount`), so both specs describe it.
 */
import type { RunState, HintLevel, Act } from './runState'

export const SAVE_KEY = 'night-shift-save'

export interface SaveState extends RunState {
  solvedBugIds: string[]
  checkpointBugId: string | null
  deathCount: number
}

export function toSave(run: RunState): SaveState {
  return {
    ...run,
    solvedBugIds: [...run.solved],
    checkpointBugId: run.solved.length ? run.solved[run.solved.length - 1] : null,
    deathCount: run.deaths,
  }
}

const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Parses a saved string. Returns null for anything missing, mistyped or unparsable; never throws. */
export function parseSave(raw: string | null): RunState | null {
  if (!raw) return null
  try {
    const d = JSON.parse(raw) as Record<string, unknown>
    const cp = d.checkpoint as Record<string, unknown> | undefined
    const hl = d.hintLevels as Record<string, unknown> | undefined
    if (!d || typeof d !== 'object') return null
    if (![1, 2, 3, 4].includes(d.act as number)) return null
    if (!isStrArray(d.solved) || !isStrArray(d.cut)) return null
    if (!isNum(d.deaths) || !isNum(d.startedAt)) return null
    if (typeof d.serverRoomReached !== 'boolean') return null
    if (!cp || (cp.room !== 'office' && cp.room !== 'server') || !isNum(cp.x) || !isNum(cp.y)) return null
    if (!hl || typeof hl !== 'object') return null
    const hintLevels: Record<string, HintLevel> = {}
    for (const [k, v] of Object.entries(hl)) {
      if (![0, 1, 2, 3].includes(v as number)) return null
      hintLevels[k] = v as HintLevel
    }
    return {
      act: d.act as Act, solved: d.solved, hintLevels, deaths: d.deaths,
      checkpoint: { room: cp.room, x: cp.x, y: cp.y }, serverRoomReached: d.serverRoomReached,
      cut: d.cut, startedAt: d.startedAt,
    }
  } catch {
    return null
  }
}

export function save(run: RunState, storage: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(toSave(run)))
  } catch {
    /* private mode or full storage: the run continues without a save */
  }
}

export function load(storage: Pick<Storage, 'getItem'> = localStorage): RunState | null {
  try {
    return parseSave(storage.getItem(SAVE_KEY))
  } catch {
    return null
  }
}

export function clear(storage: Pick<Storage, 'removeItem'> = localStorage): void {
  try {
    storage.removeItem(SAVE_KEY)
  } catch {
    /* ignore */
  }
}
