import { useEffect, useState } from 'react'
import {
  defaultSpeechSettings,
  speak,
  stopSpeaking,
  whenVoicesReady,
  type SpeechSettings,
} from '../lib/speech'
import { loadSpeechSettings, saveSpeechSettings } from '../lib/storage'

export function useSpeech() {
  const [settings, setSettings] = useState<SpeechSettings>(() =>
    loadSpeechSettings(),
  )
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    saveSpeechSettings(settings)
  }, [settings])

  useEffect(() => {
    let cancelled = false
    whenVoicesReady().then((list) => {
      if (!cancelled) setVoices(list)
    })
    return () => {
      cancelled = true
      stopSpeaking()
    }
  }, [])

  function update(partial: Partial<SpeechSettings>) {
    setSettings((s) => ({ ...s, ...partial }))
  }

  async function read(text: string) {
    if (!settings.enabled) return
    setSpeaking(true)
    try {
      await speak(text, settings)
    } finally {
      setSpeaking(false)
    }
  }

  function stop() {
    stopSpeaking()
    setSpeaking(false)
  }

  return {
    settings,
    update,
    voices,
    speaking,
    read,
    stop,
    resetSettings: () => setSettings({ ...defaultSpeechSettings }),
  }
}
