import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { askChat } from '../api/client'
import { useChatDock } from '../chat/ChatContext'
import { localKpiReply } from '../chat/localHelper'
import { formatPct } from './KpiCharts'
import ChatMascot from './ChatMascot'
import { readLastSnapshot } from '../kpiCache'
import { periodLabel } from '../period'

type Msg = {
  id: number
  role: 'user' | 'assistant'
  text: string
  source?: 'local' | 'openai'
}

let nextId = 1
const HELLO_AT = 'kpi_chat_hello_at'
const HELLO_EVERY_MS = 12 * 60 * 1000

export default function ChatWidget() {
  const { open, toggle, close } = useChatDock()
  const snap = useMemo(() => readLastSnapshot(), [open])
  const period = snap?.period ? periodLabel(snap.period) : 'periodo no cargado'
  const data = snap?.data ?? null
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [hello, setHello] = useState('')
  const [canWrite, setCanWrite] = useState(true)
  const [greeting, setGreeting] = useState(false)
  const started = messages.some((msg) => msg.role === 'user')

  useEffect(() => {
    const node = listRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages, open, hello])

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy || !canWrite) return
    setInput('')
    setMessages((prev) => [...prev, { id: nextId++, role: 'user', text }])
    setBusy(true)
    try {
      const res = await askChat(text, data, period)
      setMessages((prev) => [...prev, { id: nextId++, role: 'assistant', text: res.reply, source: res.source }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId++, role: 'assistant', text: localKpiReply(text, data, period), source: 'local' },
      ])
    } finally {
      setBusy(false)
    }
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
              {data ? `${data.asesor_nombre || 'Consolidado'} · ${period}` : 'Sin snapshot cargado'}
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
                    <p>{msg.text}</p>
                    <span className="chat-source">
                      {msg.source === 'openai' ? 'Modelo con el snapshot actual' : 'Ayuda local'}
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
            <input
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={canWrite ? '¿Cómo va el cumplimiento?' : 'Espera el saludo…'}
              autoComplete="off"
              disabled={!canWrite || busy}
            />
            <button type="submit" disabled={!canWrite || busy || !input.trim()}>
              Enviar
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}
