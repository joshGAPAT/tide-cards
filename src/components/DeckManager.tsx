import { useRef, useState } from 'react'
import {
  cardsToCsv,
  CSV_TEMPLATE,
  downloadText,
  LLM_PROMPT,
} from '../lib/csv'
import type { Deck } from '../types/deck'

type Props = {
  decks: Deck[]
  activeDeckId: string
  error: string | null
  onSelect: (id: string) => void
  onImport: (file: File, title?: string) => Promise<boolean>
  onDelete: (id: string) => void
  onClearError: () => void
}

export function DeckManager({
  decks,
  activeDeckId,
  error,
  onSelect,
  onImport,
  onDelete,
  onClearError,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setBusy(true)
    onClearError()
    await onImport(file, title)
    setBusy(false)
    setTitle('')
    if (inputRef.current) inputRef.current.value = ''
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(LLM_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const active = decks.find((d) => d.id === activeDeckId)

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xl text-[var(--tide-deep)]">Decks</p>
            <p className="text-sm text-[var(--ink-soft)]">
              Switch decks, upload CSV, or grab the template for an LLM.
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-2">
          {decks.map((deck) => {
            const activeItem = deck.id === activeDeckId
            return (
              <li key={deck.id}>
                <div
                  className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 ${
                    activeItem
                      ? 'bg-[var(--tide)] text-white'
                      : 'bg-white/80 text-[var(--ink)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(deck.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate font-semibold">{deck.title}</span>
                    <span
                      className={`block truncate text-xs ${
                        activeItem ? 'text-white/80' : 'text-[var(--ink-soft)]'
                      }`}
                    >
                      {deck.cards.length} cards
                      {deck.builtIn ? ' · built-in' : ''}
                    </span>
                  </button>
                  {!deck.builtIn && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete deck “${deck.title}”?`)) {
                          onDelete(deck.id)
                        }
                      }}
                      className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                        activeItem
                          ? 'bg-white/15 hover:bg-white/25'
                          : 'text-[var(--again)] hover:bg-[var(--again)]/10'
                      }`}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 backdrop-blur">
        <p className="font-display text-xl text-[var(--tide-deep)]">New deck from CSV</p>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Header must be: <code className="text-[var(--tide)]">topic,question,answer,explanation</code>
        </p>

        <label className="mt-4 grid gap-1 text-sm">
          <span className="font-medium text-[var(--ink-soft)]">Deck name (optional)</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chapter 34"
            className="rounded-xl border border-[var(--tide)]/20 bg-white px-3 py-2"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-2xl bg-[var(--tide)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Importing…' : 'Upload CSV'}
          </button>
          <button
            type="button"
            onClick={() => downloadText('tide-cards-template.csv', CSV_TEMPLATE)}
            className="rounded-2xl border border-[var(--tide)]/20 bg-white px-4 py-2.5 text-sm font-medium text-[var(--tide-deep)]"
          >
            Download CSV template
          </button>
          <button
            type="button"
            onClick={() =>
              downloadText(
                'tide-cards-llm-prompt.txt',
                LLM_PROMPT,
                'text/plain;charset=utf-8',
              )
            }
            className="rounded-2xl border border-[var(--tide)]/20 bg-white px-4 py-2.5 text-sm font-medium text-[var(--tide-deep)]"
          >
            Download LLM prompt
          </button>
          <button
            type="button"
            onClick={() => void copyPrompt()}
            className="rounded-2xl border border-[var(--tide)]/20 bg-white px-4 py-2.5 text-sm font-medium text-[var(--tide-deep)]"
          >
            {copied ? 'Copied!' : 'Copy LLM prompt'}
          </button>
          {active && (
            <button
              type="button"
              onClick={() =>
                downloadText(
                  `${active.title.replace(/\s+/g, '-').toLowerCase()}.csv`,
                  cardsToCsv(active.cards),
                )
              }
              className="rounded-2xl border border-[var(--tide)]/20 bg-white px-4 py-2.5 text-sm font-medium text-[var(--tide-deep)]"
            >
              Export this deck
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />

        {error && (
          <p className="mt-3 rounded-xl bg-[var(--again)]/10 px-3 py-2 text-sm text-[var(--again)]">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
