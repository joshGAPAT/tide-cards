export type Rating = 'again' | 'hard' | 'good' | 'easy'

export type CardState = {
  /** Interval in days once graduated; learning steps use minutes via due. */
  interval: number
  ease: number
  repetitions: number
  due: number
  lapses: number
}

export type DeckProgress = Record<string, CardState>

const MINUTE = 60_000
const DAY = 24 * 60 * 60_000

export function createCardState(now = Date.now()): CardState {
  return {
    interval: 0,
    ease: 2.5,
    repetitions: 0,
    due: now,
    lapses: 0,
  }
}

export function isDue(state: CardState, now = Date.now()): boolean {
  return state.due <= now
}

/**
 * Simplified Anki-style scheduling:
 * - Again → back to learning (1 min)
 * - Hard / Good / Easy graduate with increasing intervals
 */
export function schedule(state: CardState, rating: Rating, now = Date.now()): CardState {
  if (rating === 'again') {
    return {
      interval: 0,
      ease: Math.max(1.3, state.ease - 0.2),
      repetitions: 0,
      due: now + 1 * MINUTE,
      lapses: state.lapses + 1,
    }
  }

  // Still in learning (never successfully reviewed, or reset)
  if (state.repetitions === 0) {
    if (rating === 'hard') {
      return {
        ...state,
        repetitions: 0,
        due: now + 3 * MINUTE,
      }
    }
    if (rating === 'good') {
      return {
        ...state,
        repetitions: 1,
        interval: 0,
        due: now + 10 * MINUTE,
      }
    }
    // easy — graduate immediately
    return {
      interval: 4,
      ease: Math.min(3.0, state.ease + 0.15),
      repetitions: 2,
      due: now + 4 * DAY,
      lapses: state.lapses,
    }
  }

  // Second learning step
  if (state.repetitions === 1) {
    if (rating === 'hard') {
      return {
        ...state,
        due: now + 5 * MINUTE,
      }
    }
    const interval = rating === 'easy' ? 4 : 1
    return {
      interval,
      ease: rating === 'easy' ? Math.min(3.0, state.ease + 0.15) : state.ease,
      repetitions: 2,
      due: now + interval * DAY,
      lapses: state.lapses,
    }
  }

  // Review queue
  const easeDelta = rating === 'hard' ? -0.15 : rating === 'easy' ? 0.15 : 0
  const ease = Math.max(1.3, Math.min(3.0, state.ease + easeDelta))
  const multiplier =
    rating === 'hard' ? 1.2 : rating === 'easy' ? ease * 1.3 : ease
  const interval = Math.max(1, Math.round(Math.max(state.interval, 1) * multiplier))

  return {
    interval,
    ease,
    repetitions: state.repetitions + 1,
    due: now + interval * DAY,
    lapses: state.lapses,
  }
}

export function formatDue(due: number, now = Date.now()): string {
  const delta = due - now
  if (delta <= 0) return 'now'
  if (delta < MINUTE) return '<1m'
  if (delta < 60 * MINUTE) return `${Math.round(delta / MINUTE)}m`
  if (delta < DAY) return `${Math.round(delta / (60 * MINUTE))}h`
  return `${Math.round(delta / DAY)}d`
}
