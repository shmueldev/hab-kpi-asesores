type BrowserSpeech = {
  start: () => void
  stop: () => void
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
}

type SpeechCtor = new () => BrowserSpeech

function recognitionCtor(): SpeechCtor | null {
  const w = window as Window & { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function canListen(): boolean {
  return Boolean(recognitionCtor())
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function stripForVoice(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/[_#`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function pickSpanishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith('es-co')) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith('es-mx')) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith('es')) ||
    null
  )
}

export function speakText(text: string): void {
  if (!canSpeak()) return
  const clean = stripForVoice(text)
  if (!clean) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(clean)
  utter.lang = 'es-CO'
  utter.rate = 1.02
  const voice = pickSpanishVoice()
  if (voice) utter.voice = voice
  window.speechSynthesis.speak(utter)
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel()
}

export function startListening(handlers: {
  onPartial: (text: string) => void
  onFinal: (text: string) => void
  onEnd: () => void
  onError: (message: string) => void
}): () => void {
  const Ctor = recognitionCtor()
  if (!Ctor) {
    handlers.onError('Este navegador no soporta dictado. Usá Chrome o Edge.')
    handlers.onEnd()
    return () => undefined
  }
  const rec = new Ctor()
  rec.lang = 'es-CO'
  rec.interimResults = true
  rec.continuous = false
  rec.onresult = (event) => {
    const last = event.results[event.results.length - 1] as
      | (ArrayLike<{ transcript: string }> & { isFinal?: boolean })
      | undefined
    const text = Array.from(last || [])
      .map((part) => part.transcript)
      .join(' ')
      .trim()
    if (!text) return
    if (last?.isFinal) handlers.onFinal(text)
    else handlers.onPartial(text)
  }
  rec.onerror = (event) => {
    const code = event.error || 'error'
    if (code === 'not-allowed' || code === 'service-not-allowed') {
      handlers.onError('Sin permiso del micrófono.')
    } else if (code !== 'aborted' && code !== 'no-speech') {
      handlers.onError('No se escuchó bien. Probá de nuevo.')
    }
    handlers.onEnd()
  }
  rec.onend = () => handlers.onEnd()
  rec.start()
  return () => {
    try {
      rec.stop()
    } catch {
      /* ya parado */
    }
  }
}
