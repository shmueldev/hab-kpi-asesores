import type { ChatVisual } from '../api/client'
import { formatMoney, formatPct, SignedBarChart, ValueBarChart } from './KpiCharts'

function ChatLanes({ visual }: { visual: ChatVisual }) {
  const items = visual.items || []
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 1)
  return (
    <figure className="chat-figure">
      <figcaption>{visual.title}</figcaption>
      <ul className="money-lanes">
        {items.map((item) => (
          <li key={item.name}>
            <div className="money-lane-head">
              <span>{item.name}</span>
              <strong>{item.kind === 'pct' ? formatPct(item.value) : formatMoney(item.value)}</strong>
            </div>
            <div className="money-lane-track">
              <span
                className={`money-lane-fill tone-${item.tone || 'neutral'}`}
                style={{ width: `${Math.max(4, (Math.abs(item.value) / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </figure>
  )
}

function ChatPills({ visual }: { visual: ChatVisual }) {
  return (
    <figure className="chat-figure">
      <figcaption>{visual.title}</figcaption>
      <ul className="chat-pills">
        {(visual.items || []).map((item) => (
          <li key={item.name} className={`chat-pill tone-${item.tone || 'neutral'}`}>
            <span>{item.name}</span>
            <strong>{item.kind === 'pct' ? formatPct(item.value) : formatMoney(item.value)}</strong>
          </li>
        ))}
      </ul>
    </figure>
  )
}

export default function ChatVisuals({ visuals }: { visuals?: ChatVisual[] }) {
  if (!visuals?.length) return null
  return (
    <div className="chat-visuals">
      {visuals.map((visual) => {
        if (visual.type === 'pills') return <ChatPills key={visual.title} visual={visual} />
        if (visual.type === 'bars' && visual.points?.length) {
          return (
            <ValueBarChart
              key={visual.title}
              title={visual.title}
              points={visual.points}
              highlight={visual.highlight ?? 'high'}
              height={180}
            />
          )
        }
        if (visual.type === 'signed' && visual.points?.length) {
          return <SignedBarChart key={visual.title} title={visual.title} points={visual.points} height={180} />
        }
        if (visual.type === 'lanes') return <ChatLanes key={visual.title} visual={visual} />
        return null
      })}
    </div>
  )
}

export function ChatRichText({ text }: { text: string }) {
  const blocks = text.split(/\n+/)
  return (
    <div className="chat-rich">
      {blocks.map((block, index) => (
        <p key={`${index}-${block.slice(0, 12)}`}>{renderInline(block)}</p>
      ))}
    </div>
  )
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    const bold = part.match(/^\*\*(.+)\*\*$/)
    if (bold) return <strong key={index}>{bold[1]}</strong>
    return <span key={index}>{part}</span>
  })
}
