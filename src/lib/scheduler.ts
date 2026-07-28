export type Rating = 'again' | 'hard' | 'good' | 'got_it'

/** Fixed gaps within a study round (number of other cards before this one returns). */
export const ROUND_GAPS: Record<Exclude<Rating, 'got_it'>, number> = {
  again: 1,
  hard: 3,
  good: 8,
}

export type CardState = {
  /** Times marked "I get it" across sessions (for light stats only). */
  gotItCount: number
  /** Times sent back with Again. */
  lapses: number
}

export type DeckProgress = Record<string, CardState>

export function createCardState(): CardState {
  return {
    gotItCount: 0,
    lapses: 0,
  }
}

export function ratingLabel(rating: Rating): string {
  if (rating === 'got_it') return 'I get it'
  return rating[0]!.toUpperCase() + rating.slice(1)
}

/** Where to put the card back in the remaining session queue. */
export function reinsertIndex(remainingCount: number, rating: Exclude<Rating, 'got_it'>): number {
  const gap = ROUND_GAPS[rating]
  if (remainingCount <= 0) return 0
  return Math.min(gap, remainingCount)
}
