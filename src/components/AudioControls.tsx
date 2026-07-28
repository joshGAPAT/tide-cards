import { isNaturalVoice, type SpeechSettings } from '../lib/speech'

type Props = {
  settings: SpeechSettings
  voices: SpeechSynthesisVoice[]
  speaking: boolean
  onChange: (partial: Partial<SpeechSettings>) => void
  onReplay: () => void
  onStop: () => void
  compact?: boolean
}

export function AudioControls({
  settings,
  voices,
  speaking,
  onChange,
  onReplay,
  onStop,
  compact = false,
}: Props) {
  return (
    <div
      className={
        compact
          ? 'flex flex-wrap items-center gap-2'
          : 'grid gap-3 rounded-2xl border border-[var(--tide)]/15 bg-white/70 p-4 backdrop-blur'
      }
    >
      {!compact && (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-lg text-[var(--tide-deep)]">Audio</p>
            <p className="text-sm text-[var(--ink-soft)]">
              Questions and answers read aloud with your device voice.
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => onChange({ enabled: e.target.checked })}
              className="size-4 accent-[var(--tide)]"
            />
            On
          </label>
        </div>
      )}

      <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'pt-1'}`}>
        {compact && (
          <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-sm font-medium shadow-sm">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => onChange({ enabled: e.target.checked })}
              className="size-3.5 accent-[var(--tide)]"
            />
            Audio
          </label>
        )}

        <button
          type="button"
          onClick={onReplay}
          disabled={!settings.enabled}
          className="rounded-full bg-[var(--tide)] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[var(--tide-deep)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {speaking ? 'Reading…' : 'Replay'}
        </button>
        <button
          type="button"
          onClick={onStop}
          className="rounded-full border border-[var(--tide)]/25 bg-white/80 px-3 py-1.5 text-sm font-medium text-[var(--tide-deep)]"
        >
          Stop
        </button>

        {!compact && (
          <>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={settings.readQuestion}
                onChange={(e) => onChange({ readQuestion: e.target.checked })}
                className="size-3.5 accent-[var(--tide)]"
              />
              Read question
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={settings.readAnswer}
                onChange={(e) => onChange({ readAnswer: e.target.checked })}
                className="size-3.5 accent-[var(--tide)]"
              />
              Read answer
            </label>
          </>
        )}
      </div>

      {!compact && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-[var(--ink-soft)]">Voice</span>
            <select
              value={settings.voiceURI ?? ''}
              onChange={(e) =>
                onChange({ voiceURI: e.target.value || null })
              }
              className="rounded-xl border border-[var(--tide)]/20 bg-white px-3 py-2"
            >
              <option value="">Best natural (auto)</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {isNaturalVoice(v) ? '★ ' : ''}
                  {v.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-[var(--ink-soft)]">
              ★ = natural/neural voices on this device (free, no API). On Windows:
              Settings → Time & language → Speech → Manage voices.
            </span>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-[var(--ink-soft)]">
              Speed {settings.rate.toFixed(1)}×
            </span>
            <input
              type="range"
              min={0.7}
              max={1.4}
              step={0.1}
              value={settings.rate}
              onChange={(e) => onChange({ rate: Number(e.target.value) })}
              className="mt-2 accent-[var(--tide)]"
            />
          </label>
        </div>
      )}
    </div>
  )
}
