import { useEffect, useState } from 'react'
import { AudioControls } from './components/AudioControls'
import { DeckManager } from './components/DeckManager'
import { StudyCard } from './components/StudyCard'
import { useDecks } from './hooks/useDecks'
import { useSpeech } from './hooks/useSpeech'
import { useStudyDeck } from './hooks/useStudyDeck'
import { formatDue } from './lib/scheduler'

export default function App() {
  const decks = useDecks()
  const study = useStudyDeck(decks.activeDeck)
  const speech = useSpeech()
  const [revealed, setRevealed] = useState(false)
  const [cardKey, setCardKey] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const current = study.current
  const active = decks.activeDeck

  // Reset reveal in the same render as the card change so we never
  // briefly speak the new answer while revealed is still true.
  if (current?.id !== cardKey) {
    setCardKey(current?.id ?? null)
    if (revealed) setRevealed(false)
  }

  useEffect(() => {
    if (!current || !speech.settings.enabled) return

    const side = revealed ? 'answer' : 'question'
    if (side === 'question' && !speech.settings.readQuestion) return
    if (side === 'answer' && !speech.settings.readAnswer) return

    const text =
      side === 'question'
        ? `Question. ${current.question}`
        : `Answer. ${current.answer}. ${current.explanation}`

    let cancelled = false
    const timer = window.setTimeout(() => {
      if (!cancelled) void speech.read(text)
    }, 80)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      speech.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional card/reveal-driven speech
  }, [
    current?.id,
    revealed,
    speech.settings.enabled,
    speech.settings.readQuestion,
    speech.settings.readAnswer,
  ])

  useEffect(() => {
    if (!study.sessionActive || !current) return

    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!revealed) {
          speech.stop()
          setRevealed(true)
        }
        return
      }

      if (!revealed) return
      const map: Record<string, 'again' | 'hard' | 'good' | 'easy'> = {
        '1': 'again',
        '2': 'hard',
        '3': 'good',
        '4': 'easy',
      }
      const rating = map[e.key]
      if (!rating) return
      e.preventDefault()
      speech.stop()
      study.rateCurrent(rating)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [study, current, revealed, speech])

  function replay() {
    if (!current) return
    if (revealed) {
      void speech.read(`Answer. ${current.answer}. ${current.explanation}`)
    } else {
      void speech.read(`Question. ${current.question}`)
    }
  }

  if (!active) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="font-display text-3xl text-[var(--tide-deep)]">No decks yet</p>
        <p className="mt-2 text-[var(--ink-soft)]">Upload a CSV to get started.</p>
      </div>
    )
  }

  return (
    <div className="relative mx-auto min-h-screen max-w-5xl px-4 py-8 md:px-8 md:py-12">
      <header className="mb-10 animate-rise">
        <p className="font-display text-5xl tracking-tight text-[var(--tide-deep)] md:text-6xl">
          Tide Cards
        </p>
        <p className="mt-2 max-w-xl text-lg text-[var(--ink-soft)]">
          Multi-deck Anki-style review with CSV import and optional audio.
        </p>
      </header>

      {!study.sessionActive ? (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="animate-rise rounded-[28px] border border-white/70 bg-white/75 p-7 shadow-[0_24px_60px_-36px_rgba(15,76,92,0.5)] backdrop-blur md:p-9">
            <p className="text-xs font-semibold tracking-[0.16em] text-[var(--lagoon)] uppercase">
              Active deck
            </p>
            <h1 className="font-display mt-2 text-4xl text-[var(--tide-deep)] md:text-5xl">
              {active.title}
            </h1>
            <p className="mt-3 text-[var(--ink-soft)]">{active.subtitle}</p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <Stat label="Due now" value={study.stats.due} />
              <Stat label="New" value={study.stats.newCount} />
              <Stat label="In deck" value={study.stats.total} />
            </div>

            <div className="mt-8">
              <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]">
                Topic filter
              </label>
              <div className="flex flex-wrap gap-2">
                <TopicChip
                  active={study.topicFilter === 'all'}
                  onClick={() => study.setTopicFilter('all')}
                  label="All"
                />
                {study.topics.map((topic) => (
                  <TopicChip
                    key={topic}
                    active={study.topicFilter === topic}
                    onClick={() => study.setTopicFilter(topic)}
                    label={topic}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={study.stats.due === 0}
                onClick={() => study.startSession('due')}
                className="rounded-2xl bg-[var(--tide)] px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-[var(--tide)]/20 transition hover:bg-[var(--tide-deep)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {study.stats.due > 0
                  ? `Study due (${study.stats.due})`
                  : 'Nothing due'}
              </button>
              <button
                type="button"
                disabled={study.stats.total === 0}
                onClick={() => study.startSession('all')}
                className="rounded-2xl border border-[var(--tide)]/25 bg-white px-6 py-3.5 text-base font-semibold text-[var(--tide-deep)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Study all ({study.stats.total})
              </button>
              <button
                type="button"
                onClick={() => setShowSettings((s) => !s)}
                className="rounded-2xl border border-[var(--tide)]/20 bg-white px-5 py-3.5 text-base font-medium text-[var(--tide-deep)]"
              >
                Audio
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset review progress for this deck?')) {
                    study.resetAll()
                  }
                }}
                className="rounded-2xl px-4 py-3.5 text-sm font-medium text-[var(--ink-soft)] underline-offset-2 hover:underline"
              >
                Reset progress
              </button>
            </div>

            <p className="mt-3 text-xs text-[var(--ink-soft)]">
              No daily card limit — use Study all anytime. Ratings still schedule future reviews.
            </p>

            {showSettings && (
              <div className="mt-6">
                <AudioControls
                  settings={speech.settings}
                  voices={speech.voices}
                  speaking={speech.speaking}
                  onChange={speech.update}
                  onReplay={() =>
                    void speech.read(
                      'Audio is ready. Questions and answers will be read during study.',
                    )
                  }
                  onStop={speech.stop}
                />
              </div>
            )}

            <div className="mt-8 max-h-[320px] overflow-auto rounded-2xl border border-[var(--mist)] bg-white/60 p-4">
              <p className="mb-3 text-sm font-semibold text-[var(--tide-deep)]">
                Deck preview
              </p>
              <ul className="space-y-2">
                {study.filtered.map((card) => {
                  const state = study.getState(card.id)
                  return (
                    <li
                      key={card.id}
                      className="rounded-xl bg-white/80 px-3 py-2.5 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-[var(--ink)]">
                          {card.question}
                        </span>
                        <span className="shrink-0 text-xs text-[var(--ink-soft)]">
                          {formatDue(state.due)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>

          <aside className="animate-rise" style={{ animationDelay: '80ms' }}>
            <DeckManager
              decks={decks.decks}
              activeDeckId={decks.activeDeckId}
              error={decks.error}
              onSelect={decks.selectDeck}
              onImport={decks.importCsv}
              onDelete={decks.deleteDeck}
              onClearError={decks.clearError}
            />
          </aside>
        </div>
      ) : (
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                speech.stop()
                study.endSession()
              }}
              className="rounded-full border border-[var(--tide)]/20 bg-white/80 px-4 py-2 text-sm font-medium text-[var(--tide-deep)]"
            >
              ← End session
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)]">
                {active.title} · {study.studyMode === 'all' ? 'all cards' : 'due only'}
              </span>
              <AudioControls
                compact
                settings={speech.settings}
                voices={speech.voices}
                speaking={speech.speaking}
                onChange={speech.update}
                onReplay={replay}
                onStop={speech.stop}
              />
            </div>
          </div>

          {current ? (
            <StudyCard
              card={current}
              revealed={revealed}
              remaining={study.remaining}
              onReveal={() => {
                speech.stop()
                setRevealed(true)
              }}
              onRate={(rating) => {
                speech.stop()
                study.rateCurrent(rating)
              }}
            />
          ) : (
            <div className="mx-auto max-w-xl animate-rise rounded-[28px] border border-white/70 bg-white/80 p-10 text-center shadow-lg">
              <p className="font-display text-4xl text-[var(--tide-deep)]">
                Session complete
              </p>
              <p className="mt-3 text-[var(--ink-soft)]">
                Nice work. Study all anytime — there is no daily cap.
              </p>
              <button
                type="button"
                onClick={study.endSession}
                className="mt-8 rounded-2xl bg-[var(--tide)] px-6 py-3 font-semibold text-white"
              >
                Back to deck
              </button>
            </div>
          )}
        </div>
      )}

      <footer className="mt-12 text-center text-sm text-[var(--ink-soft)]">
        CSV columns: topic, question, answer, explanation
      </footer>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[var(--sand)]/70 px-3 py-4 text-center">
      <p className="font-display text-3xl text-[var(--tide-deep)]">{value}</p>
      <p className="mt-1 text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase">
        {label}
      </p>
    </div>
  )
}

function TopicChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-[var(--tide)] text-white'
          : 'bg-white/80 text-[var(--tide-deep)] hover:bg-white'
      }`}
    >
      {label}
    </button>
  )
}
