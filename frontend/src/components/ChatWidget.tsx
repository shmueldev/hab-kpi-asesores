import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { askChat, type ChatVisual } from '../api/client'
import { useChatDock } from '../chat/ChatContext'
import { canListen, canSpeak, speakText, startListening, stopSpeaking } from '../chat/speech'
import { formatPct } from './KpiCharts'
import ChatMascot from './ChatMascot'
import ChatVisuals, { ChatRichText } from './ChatVisuals'
import { kpiCacheKey, readDashPack, readLastSnapshot } from '../kpiCache'
import { periodLabel, rangeFromPeriod, selectedAsesorKey } from '../period'

type Msg = {
  id: number
  role: 'user' | 'assistant'
  text: string
  source?: 'local' | 'rescue'
  visuals?: ChatVisual[]
  suggestions?: string[]
}

let nextId = 1
const HELLO_AT = 'kpi_chat_hello_at'
const HELLO_EVERY_MS = 12 * 60 * 1000
const VOICE_KEY = 'kpi_chat_voice'

export default function ChatWidget() {
  const { open, toggle, close } = useChatDock()
  const snap = useMemo(() => readLastSnapshot(), [open])
  const pack = useMemo(() => {
    if (!snap?.period) return null
    const { fechaIni, fechaFin } = rangeFromPeriod(snap.period)
    return readDashPack(kpiCacheKey(fechaIni, fechaFin, selectedAsesorKey()))
  }, [open, snap?.period])
  const period = snap?.period ? periodLabel(snap.period) : 'periodo no cargado'
  const data = pack?.kpi ?? snap?.data ?? null
  const meses = pack?.meses?.filas ?? null
  const viewer = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('kpi_user') || '{}') as { role?: string; nombre?: string }
    } catch {
      return {}
    }
  }, [open])
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const stopMicRef = useRef<(() => void) | null>(null)

  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [hello, setHello] = useState('')
  const [canWrite, setCanWrite] = useState(true)
  const [greeting, setGreeting] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceOn, setVoiceOn] = useState(() => localStorage.getItem(VOICE_KEY) !== '0')
  const [speechNote, setSpeechNote] = useState('')
  const started = messages.some((msg) => msg.role === 'user')
  const micOk = canListen()
  const voiceOk = canSpeak()

  useEffect(() => {
    const node = listRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages, open, hello])

  useEffect(() => {
    if (!open) {
      stopMicRef.current?.()
      stopMicRef.current = null
      setListening(false)
      stopSpeaking()
    }
  }, [open])

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!open || !voiceOn || !voiceOk || !last || last.role !== 'assistant') return
    speakText(last.text)
  }, [messages, open, voiceOn, voiceOk])

  useEffect(() => {
    if (!open || !voiceOn || !voiceOk || !hello || started) return
    speakText(hello)
  }, [hello, open, voiceOn, voiceOk, started])

  useEffect(() => {
    if (!open) {
      setGreeting(false)
      setCanWrite(true)
      return
    }
    const last = Number(sessionStorage.getItem(HELLO_AT) || 0)
    const due = !last || Date.now() - last > HELLO_EVERY_MS
    if (!due) {
      setGreeting(false)
      setCanWrite(true)
      setHello((prev) => prev || 'Pregunta por cumplimiento, crecimiento o autogestión.')
      inputRef.current?.focus()
      return
    }
    setGreeting(true)
    setHello('')
    setCanWrite(false)
    const who = data?.asesor_nombre || 'el tablero'
    const say = window.setTimeout(() => {
      setHello(`Hola, soy HAB Bot. ¿En qué te ayudo con ${who} · ${period}?`)
    }, 500)
    const unlock = window.setTimeout(() => {
      sessionStorage.setItem(HELLO_AT, String(Date.now()))
      setGreeting(false)
      setCanWrite(true)
      inputRef.current?.focus()
    }, 1800)
    return () => {
      window.clearTimeout(say)
      window.clearTimeout(unlock)
    }
  }, [open, data?.asesor_nombre, period])

  function toggleVoice() {
    const next = !voiceOn
    setVoiceOn(next)
    localStorage.setItem(VOICE_KEY, next ? '1' : '0')
    if (!next) stopSpeaking()
  }

  function toggleMic() {
    if (!micOk || !canWrite || busy) return
    if (listening) {
      stopMicRef.current?.()
      stopMicRef.current = null
      setListening(false)
      return
    }
    stopSpeaking()
    setSpeechNote('')
    setListening(true)
    stopMicRef.current = startListening({
      onPartial: (text) => setInput(text),
      onFinal: (text) => {
        setInput(text)
        setListening(false)
        stopMicRef.current = null
        void ask(text)
      },
      onEnd: () => {
        setListening(false)
        stopMicRef.current = null
      },
      onError: (message) => setSpeechNote(message),
    })
  }

  async function ask(text: string) {
    const clean = text.trim()
    if (!clean || busy || !canWrite) return
    stopSpeaking()
    setSpeechNote('')
    setInput('')
    setMessages((prev) => [...prev, { id: nextId++, role: 'user', text: clean }])
    setBusy(true)
    try {
      const res = await askChat(clean, data, period, meses)
      setMessages((prev) => [
        ...prev,
        {
          id: nextId++,
          role: 'assistant',
          text: res.reply,
          source: res.source,
          visuals: res.visuals,
          suggestions: res.suggestions,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId++,
          role: 'assistant',
          text: err instanceof Error ? err.message : 'No se pudo consultar RescueAI.',
          source: 'local',
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void ask(input)
  }

  return (
    <>
      <button
        type="button"
        className={`chat-tab no-print${open ? ' is-open' : ''}`}
        data-tour="chat"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="chat-dock"
        aria-label={open ? 'Cerrar chat' : 'Abrir chat'}
        title="Chat de KPIs"
      >
        Chat
      </button>
      <aside id="chat-dock" className={`chat-dock no-print${open ? ' is-open' : ''}`} aria-hidden={!open}>
        <header className="chat-panel-head">
          <div>
            <h2>Consulta de KPIs</h2>
            <p className="muted">
              {data
                ? `${data.asesor_nombre || (viewer.role === 'admin' ? 'Consolidado' : viewer.nombre || 'Tu tablero')} · ${period}`
                : 'Sin snapshot cargado'}
              {viewer.role === 'asesor' ? ' · solo tu cartera' : ''}
            </p>
          </div>
          <button type="button" className="ghost chat-close" onClick={close} aria-label="Cerrar chat">
            Cerrar
          </button>
        </header>
        {data && (
          <p className="chat-kpis">
            Cumplimiento {formatPct(data.pct_cumpl_presupuesto)} · Crecimiento {formatPct(data.pct_crecimiento_dinero)} ·
            Autogestión {formatPct(data.pct_autogestion)}
          </p>
        )}
        <div className="chat-messages" ref={listRef} aria-live="polite">
          {(!started || greeting) && (
            <div className="chat-hero">
              <div className="chat-hero-frame">
                <ChatMascot size={132} />
              </div>
              <p className="chat-hero-title">HAB Bot</p>
              <p className={`chat-hero-text${hello ? ' is-on' : ''}`}>
                {hello || '…'}
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <article key={msg.id} className={`chat-bubble ${msg.role}`}>
              {msg.role === 'assistant' ? (
                <div className="chat-bubble-row">
                  <ChatMascot size={36} className="chat-bubble-face" />
                  <div>
                    <ChatRichText text={msg.text} />
                    <ChatVisuals visuals={msg.visuals} />
                    {!!msg.suggestions?.length && (
                      <div className="chat-suggest">
                        {msg.suggestions.map((hint) => (
                          <button key={hint} type="button" disabled={busy || !canWrite} onClick={() => void ask(hint)}>
                            {hint}
                          </button>
                        ))}
                      </div>
                    )}
                    <span className="chat-source">
                      {msg.source === 'rescue' ? 'RescueAI · rescue-main' : 'Ayuda local'}
                    </span>
                  </div>
                </div>
              ) : (
                <p>{msg.text}</p>
              )}
            </article>
          ))}
        </div>
        <form className="chat-composer" onSubmit={onSubmit}>
          <label htmlFor="chat-input">Pregunta</label>
          <div className="chat-composer-row">
            {micOk && (
              <button
                type="button"
                className={`chat-mic${listening ? ' is-on' : ''}`}
                onClick={toggleMic}
                disabled={!canWrite || busy}
                aria-pressed={listening}
                title={listening ? 'Dejar de escuchar' : 'Dictar pregunta'}
              >
                {listening ? 'Parar' : 'Mic'}
              </button>
            )}
            <input
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                listening ? 'Escuchando…' : canWrite ? '¿Cómo va el cumplimiento?' : 'Espera el saludo…'
              }
              autoComplete="off"
              disabled={!canWrite || busy}
            />
            {voiceOk && (
              <button
                type="button"
                className={`chat-voice${voiceOn ? ' is-on' : ''}`}
                onClick={toggleVoice}
                aria-pressed={voiceOn}
                title={voiceOn ? 'Silenciar al bot' : 'Volver a escuchar al bot'}
              >
                {voiceOn ? 'Silenciar' : 'Hablar'}
              </button>
            )}
            <button type="submit" disabled={!canWrite || busy || !input.trim()}>
              Enviar
            </button>
          </div>
          {speechNote && <p className="chat-speech-note">{speechNote}</p>}
          {voiceOk && (
            <p className="chat-speech-hint">
              El bot responde en texto y en voz. {voiceOn ? 'Silenciar' : 'Hablar'} apaga o enciende el audio.
              {micOk ? ' El micrófono es opcional.' : ''}
            </p>
          )}
        </form>
      </aside>
    </>
  )
}
