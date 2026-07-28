import {
  createBuiltInDecks,
  LEGACY_STARTER_DECK_ID,
  STARTER_DECK_ID,
} from '../data/starterDeck'
import type { Deck, Flashcard } from '../types/deck'
import type { DeckProgress } from './scheduler'
import { defaultSpeechSettings, type SpeechSettings } from './speech'

const DECKS_KEY = 'tide-cards-decks-v2'
const ACTIVE_DECK_KEY = 'tide-cards-active-deck-v2'
const PROGRESS_KEY = 'tide-cards-progress-v2'
const LEGACY_PROGRESS_KEY = 'tide-cards-progress-v1'
const SPEECH_KEY = 'tide-cards-speech-v1'

type ProgressByDeck = Record<string, DeckProgress>

function ensureBuiltIns(decks: Deck[]): Deck[] {
  const builtIns = createBuiltInDecks()
  const byId = new Map(decks.map((d) => [d.id, d]))

  // Migrate legacy single Chapter 33 deck id → set 1
  const legacy = byId.get(LEGACY_STARTER_DECK_ID)
  if (legacy && !byId.has(STARTER_DECK_ID)) {
    byId.set(STARTER_DECK_ID, {
      ...builtIns[0],
      // keep any local title edits unlikely; prefer built-in metadata
    })
    byId.delete(LEGACY_STARTER_DECK_ID)
  }

  // Always refresh built-in card content from code
  for (const builtIn of builtIns) {
    byId.set(builtIn.id, builtIn)
  }

  const custom = [...byId.values()].filter((d) => !d.builtIn)
  return [...builtIns, ...custom]
}

export function loadDecks(): Deck[] {
  try {
    const raw = localStorage.getItem(DECKS_KEY)
    if (!raw) return createBuiltInDecks()
    const parsed = JSON.parse(raw) as Deck[]
    if (!Array.isArray(parsed)) return createBuiltInDecks()
    return ensureBuiltIns(parsed)
  } catch {
    return createBuiltInDecks()
  }
}

export function saveDecks(decks: Deck[]): void {
  localStorage.setItem(DECKS_KEY, JSON.stringify(ensureBuiltIns(decks)))
}

export function loadActiveDeckId(): string {
  const id = localStorage.getItem(ACTIVE_DECK_KEY)
  if (!id || id === LEGACY_STARTER_DECK_ID) return STARTER_DECK_ID
  return id
}

export function saveActiveDeckId(id: string): void {
  localStorage.setItem(ACTIVE_DECK_KEY, id)
}

function loadAllProgress(): ProgressByDeck {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (raw) {
      const all = JSON.parse(raw) as ProgressByDeck
      // Migrate progress keyed under legacy deck id
      if (all[LEGACY_STARTER_DECK_ID] && !all[STARTER_DECK_ID]) {
        all[STARTER_DECK_ID] = all[LEGACY_STARTER_DECK_ID]
        delete all[LEGACY_STARTER_DECK_ID]
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(all))
      }
      return all
    }

    const legacy = localStorage.getItem(LEGACY_PROGRESS_KEY)
    if (legacy) {
      const migrated: ProgressByDeck = {
        [STARTER_DECK_ID]: JSON.parse(legacy) as DeckProgress,
      }
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(migrated))
      return migrated
    }
    return {}
  } catch {
    return {}
  }
}

function saveAllProgress(all: ProgressByDeck): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all))
}

export function loadDeckProgress(deckId: string): DeckProgress {
  return loadAllProgress()[deckId] ?? {}
}

export function saveDeckProgress(deckId: string, progress: DeckProgress): void {
  const all = loadAllProgress()
  all[deckId] = progress
  saveAllProgress(all)
}

export function resetDeckProgress(deckId: string): void {
  const all = loadAllProgress()
  delete all[deckId]
  saveAllProgress(all)
}

export function loadSpeechSettings(): SpeechSettings {
  try {
    const raw = localStorage.getItem(SPEECH_KEY)
    if (!raw) return { ...defaultSpeechSettings }
    return { ...defaultSpeechSettings, ...JSON.parse(raw) }
  } catch {
    return { ...defaultSpeechSettings }
  }
}

export function saveSpeechSettings(settings: SpeechSettings): void {
  localStorage.setItem(SPEECH_KEY, JSON.stringify(settings))
}

export function makeCardIds(
  cards: Omit<Flashcard, 'id'>[],
  deckId: string,
): Flashcard[] {
  return cards.map((card, i) => ({
    ...card,
    id: `${deckId}-${String(i + 1).padStart(4, '0')}`,
  }))
}
