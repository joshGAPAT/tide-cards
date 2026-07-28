import { useEffect, useState } from 'react'
import {
  createCardState,
  isDue,
  schedule,
  type CardState,
  type DeckProgress,
  type Rating,
} from '../lib/scheduler'
import {
  loadDeckProgress,
  resetDeckProgress,
  saveDeckProgress,
} from '../lib/storage'
import type { Deck, Flashcard } from '../types/deck'

export type StudyMode = 'due' | 'all'

function ensureStates(cards: Flashcard[], progress: DeckProgress): DeckProgress {
  const next = { ...progress }
  for (const card of cards) {
    if (!next[card.id]) next[card.id] = createCardState()
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

  const [progress, setProgress] = useState<DeckProgress>({})
  const [loadedDeckId, setLoadedDeckId] = useState('')
  const [topicFilter, setTopicFilter] = useState<string | 'all'>('all')
  const [queue, setQueue] = useState<Flashcard[]>([])
  const [sessionActive, setSessionActive] = useState(false)
  const [studyMode, setStudyMode] = useState<StudyMode>('due')

  useEffect(() => {
    if (!deckId) return
    setProgress(ensureStates(cards, loadDeckProgress(deckId)))
    setLoadedDeckId(deckId)
    setTopicFilter('all')
    setSessionActive(false)
    setQueue([])
    // cards intentionally omitted: reload progress only when switching decks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId])

  useEffect(() => {
    if (!deckId || loadedDeckId !== deckId) return
    saveDeckProgress(deckId, progress)
  }, [deckId, loadedDeckId, progress])

  const topics = [...new Set(cards.map((c) => c.topic))]

  const filtered =
    topicFilter === 'all'
      ? cards
      : cards.filter((c) => c.topic === topicFilter)

  const dueCards = filtered.filter((card) =>
    isDue(progress[card.id] ?? createCardState()),
  )

  const stats = {
    total: filtered.length,
    due: dueCards.length,
    newCount: filtered.filter((c) => (progress[c.id]?.repetitions ?? 0) === 0)
      .length,
    learned: filtered.filter((c) => (progress[c.id]?.repetitions ?? 0) >= 2)
      .length,
  }

  /** No daily new-card cap — study every matching card, or only due ones. */
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

    const prev = progress[current.id] ?? createCardState()
    const nextState = schedule(prev, rating)
    setProgress((p) => ({ ...p, [current.id]: nextState }))

    setQueue((q) => {
      const rest = q.slice(1)
      if (rating === 'again') return [...rest, current]
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
    setProgress(ensureStates(cards, {}))
    setSessionActive(false)
    setQueue([])
  }

  function getState(id: string): CardState {
    return progress[id] ?? createCardState()
  }

  return {
    progress,
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
  }
}
