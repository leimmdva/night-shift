/**
 * MonsterState.ts
 *
 * Four states for the monster AI.
 * erasableSyntaxOnly is on — no abstract classes, no constructor parameter shorthand.
 * Each state class stores ctx as an explicit field assigned in the constructor body.
 */

export type StateKey = 'PATROL' | 'ALERT' | 'CHASE' | 'SEARCH'

export interface MonsterContext {
  moveTo(x: number, y: number, speed: number): void
  stop(): void
  position(): { x: number; y: number }
  playerPosition(): { x: number; y: number }
  distanceToPlayer(): number
  canSeePlayer(): boolean
  playerIsHiding(): boolean
  transition(to: StateKey): void
  emit(event: string, data?: unknown): void
  waypoints(): { x: number; y: number }[]
  now(): number
}

export interface BaseState {
  enter(): void
  update(delta: number): void
  exit(): void
}

// ── PATROL ────────────────────────────────────────────────────────────────

export class PatrolState implements BaseState {
  ctx: MonsterContext
  detectionRadius: number
  waypointIndex: number

  constructor(ctx: MonsterContext, detectionRadius: number) {
    this.ctx = ctx
    this.detectionRadius = detectionRadius
    this.waypointIndex = 0
  }

  enter(): void {}

  update(_delta: number): void {
    if (
      this.ctx.distanceToPlayer() < this.detectionRadius &&
      this.ctx.canSeePlayer()
    ) {
      this.ctx.transition('ALERT')
      return
    }

    const waypoints = this.ctx.waypoints()
    if (waypoints.length === 0) return

    const target = waypoints[this.waypointIndex]
    const pos = this.ctx.position()
    const dist = Math.hypot(target.x - pos.x, target.y - pos.y)

    if (dist < 8) {
      this.waypointIndex = (this.waypointIndex + 1) % waypoints.length
    } else {
      this.ctx.moveTo(target.x, target.y, 60)
    }
  }

  exit(): void {}
}

// ── ALERT ─────────────────────────────────────────────────────────────────

export class AlertState implements BaseState {
  ctx: MonsterContext
  enteredAt: number

  constructor(ctx: MonsterContext) {
    this.ctx = ctx
    this.enteredAt = 0
  }

  enter(): void {
    this.ctx.stop()
    this.enteredAt = this.ctx.now()
  }

  update(_delta: number): void {
    if (this.ctx.now() - this.enteredAt >= 800) {
      this.ctx.transition('CHASE')
    }
  }

  exit(): void {}
}

// ── CHASE ─────────────────────────────────────────────────────────────────

export class ChaseState implements BaseState {
  ctx: MonsterContext
  chaseSpeed: number

  constructor(ctx: MonsterContext, chaseSpeed: number) {
    this.ctx = ctx
    this.chaseSpeed = chaseSpeed
  }

  enter(): void {}

  update(_delta: number): void {
    if (this.ctx.distanceToPlayer() < 24) {
      this.ctx.emit('player-caught')
      return
    }

    if (this.ctx.playerIsHiding()) {
      this.ctx.transition('SEARCH')
      return
    }

    const p = this.ctx.playerPosition()
    this.ctx.moveTo(p.x, p.y, this.chaseSpeed)
  }

  exit(): void {}
}

// ── SEARCH ────────────────────────────────────────────────────────────────

export class SearchState implements BaseState {
  ctx: MonsterContext
  enteredAt: number
  searchTarget: { x: number; y: number } | null

  constructor(ctx: MonsterContext) {
    this.ctx = ctx
    this.enteredAt = 0
    this.searchTarget = null
  }

  enter(): void {
    this.ctx.stop()
    this.enteredAt = this.ctx.now()
    this.pickSearchTarget()
  }

  update(_delta: number): void {
    if (this.ctx.now() - this.enteredAt >= 8000) {
      this.ctx.transition('PATROL')
      return
    }

    if (!this.ctx.playerIsHiding() && this.ctx.canSeePlayer()) {
      this.ctx.transition('CHASE')
      return
    }

    if (this.searchTarget) {
      const pos = this.ctx.position()
      const dist = Math.hypot(
        this.searchTarget.x - pos.x,
        this.searchTarget.y - pos.y
      )
      if (dist < 8) {
        this.pickSearchTarget()
      } else {
        this.ctx.moveTo(this.searchTarget.x, this.searchTarget.y, 50)
      }
    }
  }

  exit(): void {}

  pickSearchTarget(): void {
    const p = this.ctx.playerPosition()
    const angle = Math.random() * Math.PI * 2
    const radius = 60 + Math.random() * 80
    this.searchTarget = {
      x: p.x + Math.cos(angle) * radius,
      y: p.y + Math.sin(angle) * radius,
    }
  }
}
