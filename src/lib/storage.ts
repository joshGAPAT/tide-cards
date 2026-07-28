import {
  createBuiltInDecks,
  LEGACY_STARTER_DECK_ID,
  STARTER_DECK_ID,
} from '../data/starterDeck'
import type { Deck, Flashcard } from '../types/deck'
import { createCardState, type CardState, type DeckProgress } from './scheduler'
import { defaultSpeechSettings, type SpeechSettings } from './speech'

const DECKS_KEY = 'tide-cards-decks-v2'
const ACTIVE_DECK_KEY = 'tide-cards-active-deck-v2'
const PROGRESS_KEY = 'tide-cards-progress-v4'
const LEGACY_PROGRESS_V3 = 'tide-cards-progress-v3'
const LEGACY_PROGRESS_V2 = 'tide-cards-progress-v2'
const LEGACY_PROGRESS_V1 = 'tide-cards-progress-v1'
const SPEECH_KEY = 'tide-cards-speech-v1'

export type DeckSchedule = {
  tick: number
  cards: DeckProgress
}

type ProgressByDeck = Record<string, DeckSchedule>

export function createDeckSchedule(): DeckSchedule {
  return { tick: 0, cards: {} }
}

function ensureBuiltIns(decks: Deck[]): Deck[] {
  const builtIns = createBuiltInDecks()
  const byId = new Map(decks.map((d) => [d.id, d]))

  const legacy = byId.get(LEGACY_STARTER_DECK_ID)
  if (legacy && !byId.has(STARTER_DECK_ID)) {
    byId.set(STARTER_DECK_ID, { ...builtIns[0] })
    byId.delete(LEGACY_STARTER_DECK_ID)
  }

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

function normalizeCard(value: unknown): CardState {
  if (!value || typeof value !== 'object') return createCardState()
  const raw = value as Record<string, unknown>
  return {
    gotItCount:
      typeof raw.gotItCount === 'number'
        ? raw.gotItCount
        : typeof raw.repetitions === 'number' && raw.repetitions >= 2
          ? 1
          : 0,
    lapses: typeof raw.lapses === 'number' ? raw.lapses : 0,
  }
}

function normalizeSchedule(raw: unknown): DeckSchedule {
  if (raw && typeof raw === 'object' && 'cards' in raw) {
    const cardsIn = (raw as { cards: Record<string, unknown> }).cards ?? {}
    const cards: DeckProgress = {}
    for (const [id, value] of Object.entries(cardsIn)) {
      cards[id] = normalizeCard(value)
    }
    return { tick: 0, cards }
  }

  if (raw && typeof raw === 'object') {
    const cards: DeckProgress = {}
    for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
      cards[id] = normalizeCard(value)
    }
    return { tick: 0, cards }
  }

  return createDeckSchedule()
}

function loadAllProgress(): ProgressByDeck {
  try {
    for (const key of [PROGRESS_KEY, LEGACY_PROGRESS_V3, LEGACY_PROGRESS_V2]) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const all = JSON.parse(raw) as Record<string, unknown>
      const normalized: ProgressByDeck = {}
      for (const [deckId, value] of Object.entries(all)) {
        const id = deckId === LEGACY_STARTER_DECK_ID ? STARTER_DECK_ID : deckId
        normalized[id] = normalizeSchedule(value)
      }
      if (key !== PROGRESS_KEY) {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(normalized))
      }
      return normalized
    }

    const v1 = localStorage.getItem(LEGACY_PROGRESS_V1)
    if (v1) {
      const migrated: ProgressByDeck = {
        [STARTER_DECK_ID]: normalizeSchedule(JSON.parse(v1)),
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

export function loadDeckSchedule(deckId: string): DeckSchedule {
  return loadAllProgress()[deckId] ?? createDeckSchedule()
}

export function saveDeckSchedule(deckId: string, schedule: DeckSchedule): void {
  const all = loadAllProgress()
  all[deckId] = schedule
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
