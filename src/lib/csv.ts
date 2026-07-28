import type { Flashcard } from '../types/deck'

export const CSV_HEADER = 'topic,question,answer,explanation'

export const CSV_TEMPLATE = `${CSV_HEADER}
Porifera,What phylum do sponges belong to?,Porifera.,Porifera are the simplest animals and are filter feeders.
Cnidaria,What two body forms do cnidarians have?,Polyp and medusa.,These are the two major body plans.
Platyhelminthes,Are flatworms coelomates?,No.,They are acoelomates meaning they lack a body cavity.
`

export const LLM_PROMPT = `Create a Tide Cards flashcard CSV for studying.

OUTPUT RULES
- Return ONLY a CSV file (no markdown fences, no commentary).
- First row MUST be exactly this header:
${CSV_HEADER}
- One flashcard per row.
- Use UTF-8.
- Quote any field that contains commas, quotes, or newlines.
- Escape quotes by doubling them ("").
- Keep answers short (a phrase or one sentence).
- Keep explanations to one memorable sentence.
- topic = short section/theme label (reuse topics across related cards).
- Do not include id columns; the app generates ids.

COLUMN MEANINGS
- topic: grouping label (e.g. Porifera, Photosynthesis, Unit 4)
- question: front of the card
- answer: back of the card (concise)
- explanation: short memory aid shown under the answer

EXAMPLE ROWS
${CSV_TEMPLATE}
SUBJECT / SOURCE
Paste your notes or chapter content below, then generate as many useful flashcards as needed:
`

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    // skip fully empty trailing rows
    if (row.length === 1 && row[0].trim() === '') {
      row = []
      return
    }
    if (row.length) rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      pushField()
    } else if (ch === '\n') {
      pushField()
      pushRow()
    } else if (ch === '\r') {
      // ignore; handle \r\n via \n
    } else {
      field += ch
    }
  }

  // last field/row
  pushField()
  pushRow()
  return rows
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/^\uFEFF/, '')
}

export type CsvParseResult =
  | { ok: true; cards: Omit<Flashcard, 'id'>[] }
  | { ok: false; error: string }

export function parseFlashcardCsv(text: string): CsvParseResult {
  const rows = parseCsvRows(text.trim())
  if (rows.length < 2) {
    return { ok: false, error: 'CSV needs a header row and at least one card.' }
  }

  const header = rows[0].map(normalizeHeader)
  const required = ['topic', 'question', 'answer', 'explanation'] as const
  const index: Partial<Record<(typeof required)[number], number>> = {}

  for (const key of required) {
    const i = header.indexOf(key)
    if (i === -1) {
      return {
        ok: false,
        error: `Missing required column "${key}". Expected: ${CSV_HEADER}`,
      }
    }
    index[key] = i
  }

  const cards: Omit<Flashcard, 'id'>[] = []
  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r]
    const question = (cols[index.question!] ?? '').trim()
    const answer = (cols[index.answer!] ?? '').trim()
    if (!question || !answer) continue
    cards.push({
      topic: (cols[index.topic!] ?? 'General').trim() || 'General',
      question,
      answer,
      explanation: (cols[index.explanation!] ?? '').trim(),
    })
  }

  if (!cards.length) {
    return { ok: false, error: 'No valid cards found (need question + answer).' }
  }

  return { ok: true, cards }
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function cardsToCsv(cards: Pick<Flashcard, 'topic' | 'question' | 'answer' | 'explanation'>[]): string {
  const lines = [CSV_HEADER]
  for (const card of cards) {
    lines.push(
      [
        escapeCsvField(card.topic),
        escapeCsvField(card.question),
        escapeCsvField(card.answer),
        escapeCsvField(card.explanation),
      ].join(','),
    )
  }
  return `${lines.join('\n')}\n`
}

export function downloadText(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'deck'
  )
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
