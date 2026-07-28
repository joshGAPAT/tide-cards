export type Flashcard = {
  id: string
  topic: string
  question: string
  answer: string
  explanation: string
}

export type Deck = {
  id: string
  title: string
  subtitle: string
  cards: Flashcard[]
  /** Built-in starter decks cannot be deleted. */
  builtIn?: boolean
  createdAt: number
}
