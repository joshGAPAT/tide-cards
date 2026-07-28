export type SpeechSettings = {
  enabled: boolean
  readQuestion: boolean
  readAnswer: boolean
  rate: number
  voiceURI: string | null
}

export const defaultSpeechSettings: SpeechSettings = {
  enabled: true,
  readQuestion: true,
  readAnswer: true,
  rate: 1,
  voiceURI: null,
}

/** Bumps whenever speech is cancelled so in-flight speaks can abort. */
let speakEpoch = 0

function pickVoice(voiceURI: string | null): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  if (voiceURI) {
    const match = voices.find((v) => v.voiceURI === voiceURI)
    if (match) return match
  }
  return (
    voices.find((v) => v.lang.startsWith('en') && /natural|neural|premium/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith('en-US')) ||
    voices.find((v) => v.lang.startsWith('en')) ||
    voices[0]
  )
}

/** Chrome often leaves synthesis stuck paused after cancel(). */
function resetSynthesis(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  try {
    window.speechSynthesis.resume()
  } catch {
    // ignore
  }
}

export function stopSpeaking(): void {
  speakEpoch += 1
  resetSynthesis()
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function speak(
  text: string,
  settings: Pick<SpeechSettings, 'rate' | 'voiceURI'>,
): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  const epoch = ++speakEpoch
  resetSynthesis()

  // Give cancel() a beat — otherwise the next utterance is often dropped.
  await wait(60)
  if (epoch !== speakEpoch) return

  await new Promise<void>((resolve) => {
    if (epoch !== speakEpoch) {
      resolve()
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = Math.min(1.6, Math.max(0.7, settings.rate))
    const voice = pickVoice(settings.voiceURI)
    if (voice) utterance.voice = voice

    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()

    window.speechSynthesis.speak(utterance)

    // Chrome can silently pause; nudge it awake.
    try {
      window.speechSynthesis.resume()
    } catch {
      // ignore
    }
  })
}

/** Prefer Microsoft/Google "Natural" / neural voices when available. */
export function isNaturalVoice(voice: SpeechSynthesisVoice): boolean {
  return /natural|neural|online|premium|enhanced/i.test(voice.name)
}

export function getVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return []
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.startsWith('en'))
    .sort((a, b) => {
      const nat = Number(isNaturalVoice(b)) - Number(isNaturalVoice(a))
      if (nat !== 0) return nat
      return a.name.localeCompare(b.name)
    })
}

export function whenVoicesReady(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = getVoices()
    if (existing.length) {
      resolve(existing)
      return
    }
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([])
      return
    }
    const onVoices = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoices)
      resolve(getVoices())
    }
    window.speechSynthesis.addEventListener('voiceschanged', onVoices)
    setTimeout(() => resolve(getVoices()), 500)
  })
}
