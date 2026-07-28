export type Rating = 'again' | 'hard' | 'good' | 'easy'

export type CardState = {
  /** Spacing interval in number of answers (questions rated). */
  interval: number
  ease: number
  repetitions: number
  /** Card is due when deck answer-tick >= due. */
  due: number
  lapses: number
}

export type DeckProgress = Record<string, CardState>

export type DeckSchedule = {
  /** Increments once per rated answer in this deck. */
  tick: number
  cards: DeckProgress
}

export function createCardState(tick = 0): CardState {
  return {
    interval: 0,
    ease: 2.5,
    repetitions: 0,
    due: tick,
    lapses: 0,
  }
}

export function createDeckSchedule(): DeckSchedule {
  return { tick: 0, cards: {} }
}

export function isDue(state: CardState, tick: number): boolean {
  return state.due <= tick
}

/**
 * Spaced by answers, not clock time.
 * Gaps below are "show again after N more rated questions in this deck."
 */
export function schedule(state: CardState, rating: Rating, tick: number): CardState {
  if (rating === 'again') {
    return {
      interval: 0,
      ease: Math.max(1.3, state.ease - 0.2),
      repetitions: 0,
      due: tick + 1,
      lapses: state.lapses + 1,
    }
  }

  // Learning step 0
  if (state.repetitions === 0) {
    if (rating === 'hard') {
      return {
        ...state,
        repetitions: 0,
        due: tick + 3,
      }
    }
    if (rating === 'good') {
      return {
        ...state,
        repetitions: 1,
        interval: 0,
        due: tick + 10,
      }
    }
    // easy — graduate
    return {
      interval: 40,
      ease: Math.min(3.0, state.ease + 0.15),
      repetitions: 2,
      due: tick + 40,
      lapses: state.lapses,
    }
  }

  // Learning step 1
  if (state.repetitions === 1) {
    if (rating === 'hard') {
      return {
        ...state,
        due: tick + 5,
      }
    }
    const interval = rating === 'easy' ? 40 : 20
    return {
      interval,
      ease: rating === 'easy' ? Math.min(3.0, state.ease + 0.15) : state.ease,
      repetitions: 2,
      due: tick + interval,
      lapses: state.lapses,
    }
  }

  // Review queue — grow gap by ease
  const easeDelta = rating === 'hard' ? -0.15 : rating === 'easy' ? 0.15 : 0
  const ease = Math.max(1.3, Math.min(3.0, state.ease + easeDelta))
  const multiplier =
    rating === 'hard' ? 1.2 : rating === 'easy' ? ease * 1.3 : ease
  const interval = Math.max(1, Math.round(Math.max(state.interval, 1) * multiplier))

  return {
    interval,
    ease,
    repetitions: state.repetitions + 1,
    due: tick + interval,
    lapses: state.lapses,
  }
}

/** How many answers until this rating would resurface the card. */
export function previewGap(state: CardState, rating: Rating): number {
  const next = schedule(state, rating, 0)
  return next.due
}

export function formatDue(due: number, tick: number): string {
  const remaining = due - tick
  if (remaining <= 0) return 'now'
  if (remaining === 1) return '1q'
  return `${remaining}q`
}
