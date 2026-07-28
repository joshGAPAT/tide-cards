import { useEffect, useState } from 'react'
import { createBuiltInDecks, STARTER_DECK_ID } from '../data/starterDeck'
import { parseFlashcardCsv, slugify } from '../lib/csv'
import {
  loadActiveDeckId,
  loadDecks,
  makeCardIds,
  resetDeckProgress,
  saveActiveDeckId,
  saveDecks,
} from '../lib/storage'
import type { Deck } from '../types/deck'

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>(() => loadDecks())
  const [activeDeckId, setActiveDeckId] = useState(() => loadActiveDeckId())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    saveDecks(decks)
  }, [decks])

  useEffect(() => {
    saveActiveDeckId(activeDeckId)
  }, [activeDeckId])

  const activeDeck =
    decks.find((d) => d.id === activeDeckId) ?? decks[0] ?? null

  function selectDeck(id: string) {
    setActiveDeckId(id)
    setError(null)
  }

  async function importCsv(file: File, title?: string): Promise<boolean> {
    const text = await file.text()
    const parsed = parseFlashcardCsv(text)
    if (!parsed.ok) {
      setError(parsed.error)
      return false
    }

    const baseTitle =
      title?.trim() ||
      file.name.replace(/\.csv$/i, '').replace(/[_-]+/g, ' ').trim() ||
      'Imported deck'
    const builtInIds = new Set(createBuiltInDecks().map((d) => d.id))
    const idBase = slugify(baseTitle)
    let id = idBase
    let n = 2
    while (decks.some((d) => d.id === id) || builtInIds.has(id)) {
      id = `${idBase}-${n++}`
    }

    const deck: Deck = {
      id,
      title: baseTitle,
      subtitle: `${parsed.cards.length} cards · uploaded ${new Date().toLocaleDateString()}`,
      cards: makeCardIds(parsed.cards, id),
      createdAt: Date.now(),
    }

    setDecks((prev) => [...prev, deck])
    setActiveDeckId(id)
    setError(null)
    return true
  }

  function deleteDeck(id: string) {
    const deck = decks.find((d) => d.id === id)
    if (!deck || deck.builtIn) return
    resetDeckProgress(id)
    const next = decks.filter((d) => d.id !== id)
    setDecks(next)
    if (activeDeckId === id) {
      setActiveDeckId(next[0]?.id ?? STARTER_DECK_ID)
    }
  }

  function renameDeck(id: string, title: string) {
    const trimmed = title.trim()
    if (!trimmed) return
    setDecks((prev) =>
      prev.map((d) => (d.id === id && !d.builtIn ? { ...d, title: trimmed } : d)),
    )
  }

  return {
    decks,
    activeDeck,
    activeDeckId,
    selectDeck,
    importCsv,
    deleteDeck,
    renameDeck,
    error,
    clearError: () => setError(null),
  }
}
