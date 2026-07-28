import {
  createBuiltInDecks,
  LEGACY_STARTER_DECK_ID,
  STARTER_DECK_ID,
} from '../data/starterDeck'
import type { Deck, Flashcard } from '../types/deck'
import {
  createCardState,
  createDeckSchedule,
  type CardState,
  type DeckSchedule,
} from './scheduler'
import { defaultSpeechSettings, type SpeechSettings } from './speech'

const DECKS_KEY = 'tide-cards-decks-v2'
const ACTIVE_DECK_KEY = 'tide-cards-active-deck-v2'
const PROGRESS_KEY = 'tide-cards-progress-v3'
const LEGACY_PROGRESS_V2 = 'tide-cards-progress-v2'
const LEGACY_PROGRESS_V1 = 'tide-cards-progress-v1'
const SPEECH_KEY = 'tide-cards-speech-v1'

type ProgressByDeck = Record<string, DeckSchedule>

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

function looksLikeCardState(value: unknown): value is CardState {
  return (
    !!value &&
    typeof value === 'object' &&
    'due' in value &&
    'ease' in value &&
    'repetitions' in value
  )
}

/** Convert old time-based or flat maps into answer-tick schedules. */
function normalizeSchedule(raw: unknown): DeckSchedule {
  if (
    raw &&
    typeof raw === 'object' &&
    'tick' in raw &&
    'cards' in raw &&
    typeof (raw as DeckSchedule).tick === 'number'
  ) {
    return raw as DeckSchedule
  }

  // Legacy: flat Record<cardId, CardState> with timestamp dues
  if (raw && typeof raw === 'object') {
    const cards: Record<string, CardState> = {}
    for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
      if (!looksLikeCardState(value)) continue
      cards[id] = {
        ...createCardState(0),
        ease: value.ease,
        repetitions: value.repetitions,
        lapses: value.lapses ?? 0,
        // Old day-intervals become question-intervals; force due now.
        interval:
          value.repetitions >= 2
            ? Math.max(20, Math.min(200, Math.round(value.interval || 20)))
            : 0,
        due: 0,
      }
    }
    return { tick: 0, cards }
  }

  return createDeckSchedule()
}

function loadAllProgress(): ProgressByDeck {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (raw) {
      const all = JSON.parse(raw) as Record<string, unknown>
      const normalized: ProgressByDeck = {}
      for (const [deckId, value] of Object.entries(all)) {
        normalized[deckId] = normalizeSchedule(value)
      }
      if (normalized[LEGACY_STARTER_DECK_ID] && !normalized[STARTER_DECK_ID]) {
        normalized[STARTER_DECK_ID] = normalized[LEGACY_STARTER_DECK_ID]
        delete normalized[LEGACY_STARTER_DECK_ID]
      }
      return normalized
    }

    const v2 = localStorage.getItem(LEGACY_PROGRESS_V2)
    if (v2) {
      const legacy = JSON.parse(v2) as Record<string, unknown>
      const migrated: ProgressByDeck = {}
      for (const [deckId, value] of Object.entries(legacy)) {
        const id = deckId === LEGACY_STARTER_DECK_ID ? STARTER_DECK_ID : deckId
        migrated[id] = normalizeSchedule(value)
      }
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(migrated))
      return migrated
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
