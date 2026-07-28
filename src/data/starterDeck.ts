import type { Deck } from '../types/deck'
import { builtinFromCsv } from './builtin/loadBuiltinCsv'
import { DECK_SUBTITLE, DECK_TITLE, flashcards as set1 } from './chapter33'
import { flashcards as set2 } from './chapter33Set2'
import { flashcards as set3 } from './chapter33Set3'
import { flashcards as set4 } from './chapter33Set4'

export const STARTER_DECK_ID = 'chapter-33-set-1'

/** Legacy id from the first release — migrated to set 1. */
export const LEGACY_STARTER_DECK_ID = 'chapter-33'

export function createBuiltInDecks(): Deck[] {
  const c = builtinFromCsv
  return [
    {
      id: 'chapter-32-set-1',
      title: 'Chapter 32 · Set 1',
      subtitle: 'Animals, development, Hox genes & early evolution',
      cards: c.chapter32Set1,
      builtIn: true,
      createdAt: 10,
    },
    {
      id: 'chapter-32-set-2',
      title: 'Chapter 32 · Set 2',
      subtitle: 'Body cavities, protostomes & deuterostomes',
      cards: c.chapter32Set2,
      builtIn: true,
      createdAt: 11,
    },
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
    {
      id: 'chapter-34-set-1',
      title: 'Chapter 34 · Set 1',
      subtitle: 'Chordates, lancelets & tunicates',
      cards: c.chapter34Set1,
      builtIn: true,
      createdAt: 20,
    },
    {
      id: 'chapter-34-set-2',
      title: 'Chapter 34 · Set 2',
      subtitle: 'Bony fishes, lobe-fins, tetrapods & amphibians',
      cards: c.chapter34Set2,
      builtIn: true,
      createdAt: 21,
    },
    {
      id: 'chapter-34-set-3',
      title: 'Chapter 34 · Set 3',
      subtitle: 'Amniotes, reptiles & birds',
      cards: c.chapter34Set3,
      builtIn: true,
      createdAt: 22,
    },
    {
      id: 'chapter-34-set-4',
      title: 'Chapter 34 · Set 4',
      subtitle: 'Mammals, monotremes, marsupials, eutherians & apes',
      cards: c.chapter34Set4,
      builtIn: true,
      createdAt: 23,
    },
    {
      id: 'chapter-34-set-6',
      title: 'Chapter 34 · Set 6',
      subtitle: 'Primates & human evolution',
      cards: c.chapter34Set6,
      builtIn: true,
      createdAt: 25,
    },
    {
      id: 'chapter-34-remaining',
      title: 'Chapter 34 · Remaining',
      subtitle: 'Extra amniote / reptile / bird review cards',
      cards: c.chapter34Remaining,
      builtIn: true,
      createdAt: 26,
    },
  ]
}

/** @deprecated use createBuiltInDecks */
export function createStarterDeck(): Deck {
  return createBuiltInDecks()[0]
}
