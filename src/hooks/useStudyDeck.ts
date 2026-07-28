import { useEffect, useState } from 'react'
import {
  createCardState,
  reinsertIndex,
  type CardState,
  type DeckProgress,
  type Rating,
} from '../lib/scheduler'
import {
  loadDeckSchedule,
  resetDeckProgress,
  saveDeckSchedule,
} from '../lib/storage'
import type { Deck, Flashcard } from '../types/deck'

export type StudyMode = 'all'

function ensureStates(cards: Flashcard[], progress: DeckProgress): DeckProgress {
  const next = { ...progress }
  for (const card of cards) {
    if (!next[card.id]) next[card.id] = createCardState()
    else {
      // Migrate any leftover SM-2-shaped objects
      const raw = next[card.id] as CardState & { repetitions?: number; lapses?: number }
      next[card.id] = {
        gotItCount: raw.gotItCount ?? 0,
        lapses: raw.lapses ?? 0,
      }
    }
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
  const [gotItThisRound, setGotItThisRound] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    if (!deckId) return
    const loaded = loadDeckSchedule(deckId)
    setProgress(ensureStates(cards, loaded.cards ?? {}))
    setLoadedDeckId(deckId)
    setTopicFilter('all')
    setSessionActive(false)
    setQueue([])
    setGotItThisRound(new Set())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId])

  useEffect(() => {
    if (!deckId || loadedDeckId !== deckId) return
    saveDeckSchedule(deckId, { tick: 0, cards: progress })
  }, [deckId, loadedDeckId, progress])

  const topics = [...new Set(cards.map((c) => c.topic))]

  const filtered =
    topicFilter === 'all'
      ? cards
      : cards.filter((c) => c.topic === topicFilter)

  const stats = {
    total: filtered.length,
    due: filtered.length,
    newCount: filtered.filter((c) => (progress[c.id]?.gotItCount ?? 0) === 0).length,
    learned: filtered.filter((c) => (progress[c.id]?.gotItCount ?? 0) > 0).length,
    remainingInRound: queue.length,
    gotItInRound: gotItThisRound.size,
  }

  function startSession(_mode: StudyMode = 'all') {
    if (!filtered.length) return
    setGotItThisRound(new Set())
    setQueue(shuffle(filtered))
    setSessionActive(true)
  }

  function rateCurrent(rating: Rating) {
    const current = queue[0]
    if (!current) return

    setProgress((prev) => {
      const card = prev[current.id] ?? createCardState()
      if (rating === 'got_it') {
        return {
          ...prev,
          [current.id]: {
            ...card,
            gotItCount: card.gotItCount + 1,
          },
        }
      }
      if (rating === 'again') {
        return {
          ...prev,
          [current.id]: {
            ...card,
            lapses: card.lapses + 1,
          },
        }
      }
      return prev
    })

    if (rating === 'got_it') {
      setGotItThisRound((s) => new Set(s).add(current.id))
    }

    setQueue((q) => {
      const rest = q.slice(1)
      if (rating === 'got_it') return rest
      const at = reinsertIndex(rest.length, rating)
      const next = [...rest]
      next.splice(at, 0, current)
      return next
    })
  }

  function endSession() {
    setSessionActive(false)
    setQueue([])
    setGotItThisRound(new Set())
  }

  function resetAll() {
    if (!deckId) return
    resetDeckProgress(deckId)
    setProgress(ensureStates(cards, {}))
    setSessionActive(false)
    setQueue([])
    setGotItThisRound(new Set())
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
    studyMode: 'all' as const,
    stats,
    filtered,
    gotItThisRound,
    startSession,
    rateCurrent,
    endSession,
    resetAll,
    getState,
  }
}
