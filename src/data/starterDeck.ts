import type { Deck } from '../types/deck'
import { DECK_SUBTITLE, DECK_TITLE, flashcards as set1 } from './chapter33'
import { flashcards as set2 } from './chapter33Set2'
import { flashcards as set3 } from './chapter33Set3'
import { flashcards as set4 } from './chapter33Set4'

export const STARTER_DECK_ID = 'chapter-33-set-1'

/** Legacy id from the first release — migrated to set 1. */
export const LEGACY_STARTER_DECK_ID = 'chapter-33'

export function createBuiltInDecks(): Deck[] {
  return [
    {
      id: STARTER_DECK_ID,
      title: `${DECK_TITLE} · Set 1`,
      subtitle: `${DECK_SUBTITLE} · Q1–30`,
      cards: set1,
      builtIn: true,
      createdAt: 0,
    },
    {
      id: 'chapter-33-set-2',
      title: 'Chapter 33 · Set 2',
      subtitle: 'Mollusks, chitons, gastropods, bivalves, cephalopods & annelids · Q31–60',
      cards: set2,
      builtIn: true,
      createdAt: 1,
    },
    {
      id: 'chapter-33-set-3',
      title: 'Chapter 33 · Set 3',
      subtitle: 'Ecdysozoans, nematodes, arthropods, chelicerates, arachnids & myriapods · Q61–90',
      cards: set3,
      builtIn: true,
      createdAt: 2,
    },
    {
      id: 'chapter-33-set-4',
      title: 'Chapter 33 · Set 4',
      subtitle: 'Pancrustaceans, insects, metamorphosis, deuterostomes & echinoderms · Q91–120',
      cards: set4,
      builtIn: true,
      createdAt: 3,
    },
  ]
}

/** @deprecated use createBuiltInDecks */
export function createStarterDeck(): Deck {
  return createBuiltInDecks()[0]
}
