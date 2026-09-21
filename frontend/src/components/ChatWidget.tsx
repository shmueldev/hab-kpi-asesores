import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { askChat } from '../api/client'
import { useChatDock } from '../chat/ChatContext'
import { localKpiReply } from '../chat/localHelper'
import { formatPct } from './KpiCharts'
import { readLastSnapshot } from '../kpiCache'
import { periodLabel } from '../period'

type Msg = {
  id: number
  role: 'user' | 'assistant'
  text: string
  source?: 'local' | 'openai'
}

let nextId = 1

export default function ChatWidget() {
  const { open, toggle, close } = useChatDock()
  const snap = useMemo(() => readLastSnapshot(), [open])
  const period = snap?.period ? periodLabel(snap.period) : 'periodo no cargado'
  const data = snap?.data ?? null
  const listRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      id: nextId++,
      role: 'assistant',
      text: 'Pregunta por cumplimiento, crecimiento o autogestión del periodo que ya cargaste.',
      source: 'local',
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const node = listRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages, open])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
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
        className={`chat-tab${open ? ' is-open' : ''}`}
        data-tour="chat"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="chat-dock"
      >
        Chat
      </button>
      <aside id="chat-dock" className={`chat-dock${open ? ' is-open' : ''}`} aria-hidden={!open}>
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
          {messages.map((msg) => (
            <article key={msg.id} className={`chat-bubble ${msg.role}`}>
              <p>{msg.text}</p>
              {msg.role === 'assistant' && (
                <span className="chat-source">
                  {msg.source === 'openai' ? 'Modelo con el snapshot actual' : 'Ayuda local'}
                </span>
              )}
            </article>
          ))}
        </div>
        <form className="chat-composer" onSubmit={onSubmit}>
          <label htmlFor="chat-input">Pregunta</label>
          <div className="chat-composer-row">
            <input
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="¿Cómo va el cumplimiento?"
              autoComplete="off"
              disabled={busy}
            />
            <button type="submit" disabled={busy || !input.trim()}>
              Enviar
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}
