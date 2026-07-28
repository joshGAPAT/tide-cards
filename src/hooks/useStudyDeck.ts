import { useEffect, useState } from 'react'
import {
  createCardState,
  createDeckSchedule,
  formatDue,
  isDue,
  previewGap,
  schedule,
  type CardState,
  type DeckProgress,
  type DeckSchedule,
  type Rating,
} from '../lib/scheduler'
import {
  loadDeckSchedule,
  resetDeckProgress,
  saveDeckSchedule,
} from '../lib/storage'
import type { Deck, Flashcard } from '../types/deck'

export type StudyMode = 'due' | 'all'

function ensureStates(cards: Flashcard[], progress: DeckProgress): DeckProgress {
  const next = { ...progress }
  for (const card of cards) {
    if (!next[card.id]) next[card.id] = createCardState(0)
  }
  return next
}

function shuffle<T>(items: T[]): T[] {
  const due = [...items]
  for (let i = due.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[due[i], due[j]] = [due[j], due[i]]
  }
  return due
}

export function useStudyDeck(deck: Deck | null) {
  const deckId = deck?.id ?? ''
  const cards = deck?.cards ?? []

  const [scheduleState, setScheduleState] = useState<DeckSchedule>(() =>
    createDeckSchedule(),
  )
  const [loadedDeckId, setLoadedDeckId] = useState('')
  const [topicFilter, setTopicFilter] = useState<string | 'all'>('all')
  const [queue, setQueue] = useState<Flashcard[]>([])
  const [sessionActive, setSessionActive] = useState(false)
  const [studyMode, setStudyMode] = useState<StudyMode>('due')

  const tick = scheduleState.tick
  const progress = scheduleState.cards

  useEffect(() => {
    if (!deckId) return
    const loaded = loadDeckSchedule(deckId)
    setScheduleState({
      tick: loaded.tick,
      cards: ensureStates(cards, loaded.cards),
    })
    setLoadedDeckId(deckId)
    setTopicFilter('all')
    setSessionActive(false)
    setQueue([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId])

  useEffect(() => {
    if (!deckId || loadedDeckId !== deckId) return
    saveDeckSchedule(deckId, scheduleState)
  }, [deckId, loadedDeckId, scheduleState])

  const topics = [...new Set(cards.map((c) => c.topic))]

  const filtered =
    topicFilter === 'all'
      ? cards
      : cards.filter((c) => c.topic === topicFilter)

  const dueCards = filtered.filter((card) =>
    isDue(progress[card.id] ?? createCardState(tick), tick),
  )

  const stats = {
    total: filtered.length,
    due: dueCards.length,
    newCount: filtered.filter((c) => (progress[c.id]?.repetitions ?? 0) === 0)
      .length,
    learned: filtered.filter((c) => (progress[c.id]?.repetitions ?? 0) >= 2)
      .length,
  }

  function startSession(mode: StudyMode = 'due') {
    const pool = mode === 'all' ? filtered : dueCards
    if (!pool.length) return
    setStudyMode(mode)
    setQueue(shuffle(pool))
    setSessionActive(true)
  }

  function rateCurrent(rating: Rating) {
    const current = queue[0]
    if (!current) return

    setScheduleState((prev) => {
      const nextTick = prev.tick + 1
      const cardPrev = prev.cards[current.id] ?? createCardState(prev.tick)
      const cardNext = schedule(cardPrev, rating, nextTick)
      return {
        tick: nextTick,
        cards: { ...prev.cards, [current.id]: cardNext },
      }
    })

    setQueue((q) => {
      const rest = q.slice(1)
      // Again: put back after a few cards in this session too
      if (rating === 'again') {
        const insertAt = Math.min(1, rest.length)
        const next = [...rest]
        next.splice(insertAt, 0, current)
        return next
      }
      return rest
    })
  }

  function endSession() {
    setSessionActive(false)
    setQueue([])
  }

  function resetAll() {
    if (!deckId) return
    resetDeckProgress(deckId)
    setScheduleState({
      tick: 0,
      cards: ensureStates(cards, {}),
    })
    setSessionActive(false)
    setQueue([])
  }

  function getState(id: string): CardState {
    return progress[id] ?? createCardState(tick)
  }

  function dueLabel(id: string): string {
    return formatDue(getState(id).due, tick)
  }

  function ratingHints(id: string): Record<Rating, string> {
    const state = getState(id)
    return {
      again: `${previewGap(state, 'again')}q`,
      hard: `${previewGap(state, 'hard')}q`,
      good: `${previewGap(state, 'good')}q`,
      easy: `${previewGap(state, 'easy')}q`,
    }
  }

  return {
    progress,
    tick,
    topicFilter,
    setTopicFilter,
    topics,
    queue,
    current: queue[0] ?? null,
    remaining: queue.length,
    sessionActive,
    studyMode,
    stats,
    filtered,
    startSession,
    rateCurrent,
    endSession,
    resetAll,
    getState,
    dueLabel,
    ratingHints,
  }
}
