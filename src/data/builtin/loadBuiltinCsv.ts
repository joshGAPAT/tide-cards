import { parseFlashcardCsv, makeCardIds } from '../../lib/csv'
import type { Flashcard } from '../../types/deck'

import chapter32Set1 from './Chapter_32_Set_1.csv?raw'
import chapter32Set2 from './Chapter_32_Set_2.csv?raw'
import chapter34Set1 from './Chapter_34_Flashcards_Set_1.csv?raw'
import chapter34Set2 from './Chapter_34_Flashcards_Set_2.csv?raw'
import chapter34Set3 from './Chapter_34_Flashcards_Set_3.csv?raw'
import chapter34Set4 from './Chapter_34_Flashcards_Set_4.csv?raw'
import chapter34Set6 from './Chapter_34_Set_6_Primates_Human_Evolution.csv?raw'
import chapter34Remaining from './Chapter_34_Remaining_Flashcards.csv?raw'

function cardsFromCsv(csv: string, deckId: string): Flashcard[] {
  const parsed = parseFlashcardCsv(csv)
  if (!parsed.ok) {
    console.error(`Failed to parse built-in deck ${deckId}:`, parsed.error)
    return []
  }
  return makeCardIds(parsed.cards, deckId)
}

export const builtinFromCsv = {
  chapter32Set1: cardsFromCsv(chapter32Set1, 'chapter-32-set-1'),
  chapter32Set2: cardsFromCsv(chapter32Set2, 'chapter-32-set-2'),
  chapter34Set1: cardsFromCsv(chapter34Set1, 'chapter-34-set-1'),
  chapter34Set2: cardsFromCsv(chapter34Set2, 'chapter-34-set-2'),
  chapter34Set3: cardsFromCsv(chapter34Set3, 'chapter-34-set-3'),
  chapter34Set4: cardsFromCsv(chapter34Set4, 'chapter-34-set-4'),
  chapter34Set6: cardsFromCsv(chapter34Set6, 'chapter-34-set-6'),
  chapter34Remaining: cardsFromCsv(
    chapter34Remaining,
    'chapter-34-remaining',
  ),
}
