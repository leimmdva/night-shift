/**
 * runState.ts — the state of one run. Pure TypeScript, no Phaser (see game-flow design).
 * All functions return a new state; they never mutate their input.
 */

export type Act = 1 | 2 | 3 | 4 // 4 = final
export type HintLevel = 0 | 1 | 2 | 3

export interface Checkpoint {
  room: 'office' | 'server'
  x: number // tile coordinates of the hide-spot enter tile (or the entrance spawn)
  y: number
}

export interface RunState {
  act: Act
  solved: string[]
  hintLevels: Record<string, HintLevel>
  deaths: number
  checkpoint: Checkpoint
  serverRoomReached: boolean
  cut: string[]
  startedAt: number
}

export function newRun(start: Checkpoint, now = Date.now()): RunState {
  return {
    act: 1,
    solved: [],
    hintLevels: {},
    deaths: 0,
    checkpoint: start,
    serverRoomReached: false,
    cut: [],
    startedAt: now,
  }
}

/** Act of a pack by its order: 1–2 Act 1, 3–5 Act 2, 6–7 Act 3, 8 final. */
export function actOf(packOrder: number): Act {
  if (packOrder <= 2) return 1
  if (packOrder <= 5) return 2
  if (packOrder <= 7) return 3
  return 4
}

export const ACT_CLOCK: Record<Act, string> = { 1: '23:47', 2: '00:30', 3: '02:00', 4: '03:33' }

/** Marks a pack solved. Idempotent. The checkpoint moves to `checkpoint` when one is given. */
export function onSolved(state: RunState, packId: string, checkpoint?: Checkpoint): RunState {
  return {
    ...state,
    solved: state.solved.includes(packId) ? state.solved : [...state.solved, packId],
    checkpoint: checkpoint ?? state.checkpoint,
  }
}

/** The player was caught by the monster of `packId`: one more death, one more hint level (max 3). */
export function onCaught(state: RunState, packId: string): RunState {
  const level = Math.min(3, (state.hintLevels[packId] ?? 0) + 1) as HintLevel
  return {
    ...state,
    deaths: state.deaths + 1,
    hintLevels: { ...state.hintLevels, [packId]: level },
  }
}
