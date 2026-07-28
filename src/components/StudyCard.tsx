import type { Flashcard } from '../types/deck'
import { ROUND_GAPS, type Rating } from '../lib/scheduler'

type Props = {
  card: Flashcard
  revealed: boolean
  remaining: number
  onReveal: () => void
  onRate: (rating: Rating) => void
}

const ratings: { id: Rating; label: string; hint: string; color: string }[] = [
  { id: 'again', label: 'Again', hint: `in ${ROUND_GAPS.again}q`, color: 'var(--again)' },
  { id: 'hard', label: 'Hard', hint: `in ${ROUND_GAPS.hard}q`, color: 'var(--hard)' },
  { id: 'good', label: 'Good', hint: `in ${ROUND_GAPS.good}q`, color: 'var(--ok)' },
  { id: 'got_it', label: 'I get it', hint: 'done this round', color: 'var(--easy)' },
]

export function StudyCard({ card, revealed, remaining, onReveal, onRate }: Props) {
  return (
    <div className="mx-auto w-full max-w-2xl animate-rise">
      <div className="mb-4 flex items-center justify-between gap-3 text-sm text-[var(--ink-soft)]">
        <span className="rounded-full bg-white/70 px-3 py-1 font-medium shadow-sm">
          {card.topic}
        </span>
        <span>{remaining} left this round</span>
      </div>

      <div
        className="relative min-h-[280px] rounded-[28px] border border-white/60 bg-white/85 p-8 shadow-[0_20px_50px_-28px_rgba(15,76,92,0.45)] backdrop-blur md:p-10"
        style={{ perspective: '1000px' }}
      >
        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-[var(--lagoon)] uppercase">
          Question
        </p>
        <h2 className="font-display text-3xl leading-tight text-[var(--tide-deep)] md:text-4xl">
          {card.question}
        </h2>

        {revealed ? (
          <div className="animate-flip mt-8 border-t border-[var(--mist)] pt-6">
            <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-[var(--coral)] uppercase">
              Answer
            </p>
            <p className="text-2xl font-semibold text-[var(--ink)] md:text-3xl">
              {card.answer}
            </p>
            <p className="mt-4 text-base leading-relaxed text-[var(--ink-soft)]">
              {card.explanation}
            </p>
          </div>
        ) : (
          <p className="mt-10 text-sm text-[var(--ink-soft)]">
            Think of the answer, then reveal.
          </p>
        )}
      </div>

      <div className="mt-6">
        {!revealed ? (
          <button
            type="button"
            onClick={onReveal}
            className="w-full rounded-2xl bg-[var(--tide)] px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-[var(--tide)]/25 transition hover:bg-[var(--tide-deep)]"
          >
            Show answer <span className="ml-2 text-sm font-normal opacity-80">Space</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ratings.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onRate(r.id)}
                className="rounded-2xl px-3 py-3 text-white shadow-md transition hover:brightness-110"
                style={{ background: r.color }}
              >
                <span className="block font-semibold">
                  {r.label}{' '}
                  <span className="text-xs font-normal opacity-80">{i + 1}</span>
                </span>
                <span className="block text-xs opacity-90">{r.hint}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
