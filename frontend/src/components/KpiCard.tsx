type IconName = 'trophy' | 'trend' | 'target' | 'wallet' | 'people' | 'check' | 'clock' | 'alert' | 'docs'

type Props = {
  title: string
  value: string
  subtitle?: string
  detail?: string
  percent?: number
  tone?: 'ok' | 'bad' | 'neutral'
  delta?: string
  spark?: number[]
  icon?: IconName
  onOpen?: () => void
  tour?: string
}

function CardIcon({ name }: { name: IconName }) {
  if (name === 'trophy') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path
          d="M7 5h10v2.2a5 5 0 0 1-3.4 4.7L13 12.2V15h3v2H8v-2h3v-2.8l-.6-.3A5 5 0 0 1 7 7.2V5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M7 6.2H4.8A2.2 2.2 0 0 0 4.6 10 4 4 0 0 0 8 8.2M17 6.2h2.2A2.2 2.2 0 0 1 19.4 10 4 4 0 0 1 16 8.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    )
  }
  if (name === 'trend') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M4 16.5 9.2 11l3.4 3.2L20 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.5 7H20v5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (name === 'target') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    )
  }
  if (name === 'people') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <circle cx="9" cy="8.2" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M4.8 17.2c.4-2.6 2.1-4 4.2-4s3.8 1.4 4.2 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="16.2" cy="8.6" r="1.8" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M15.4 13.4c1.8.2 3.2 1.4 3.6 3.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'check') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="7.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8.4 12.2 11 14.7 15.7 9.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (name === 'clock') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="7.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 8.2V12l2.8 1.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'alert') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M12 4.6 4.6 18.2h14.8L12 4.6Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M12 10v4.2M12 16.4v.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'docs') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <rect x="6" y="4.5" width="10.5" height="14.2" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8.8 4.5V7h8.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M8.6 11h5.4M8.6 14h4.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="4" y="7" width="16" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 11h16M8 7V5.8A1.8 1.8 0 0 1 9.8 4h4.4A1.8 1.8 0 0 1 16 5.8V7" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function Sparkline({ values, tone }: { values: number[]; tone: 'ok' | 'bad' | 'neutral' }) {
  const w = 128
  const h = 44
  const pad = 3
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const coords = values.map((v, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / span) * (h - pad * 2)
    return { x, y }
  })
  const points = coords.map((p) => `${p.x},${p.y}`).join(' ')
  const last = coords[coords.length - 1]
  const color = tone === 'ok' ? 'var(--ok)' : tone === 'bad' ? 'var(--bad)' : 'var(--highlight)'

  return (
    <svg className="kpi-spark" viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {last ? <circle cx={last.x} cy={last.y} r="2.6" fill={color} /> : null}
    </svg>
  )
}

export default function KpiCard({
  title,
  value,
  subtitle,
  detail,
  percent,
  tone = 'neutral',
  delta,
  spark,
  icon,
  onOpen,
  tour,
}: Props) {
  const bar = percent == null ? 0 : Math.max(0, Math.min(Math.abs(percent) * 100, 100))
  const barColor = tone === 'ok' ? 'var(--ok)' : tone === 'bad' ? 'var(--bad)' : 'var(--highlight)'
  const showSpark = Boolean(spark && spark.length >= 2)

  return (
    <article
      data-tour={tour}
      className={`kpi-card neon-card tone-${tone}${onOpen ? ' clickable' : ''}${icon ? ' has-icon' : ''}${showSpark ? ' has-spark' : ''}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (onOpen && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onOpen()
        }
      }}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <div className="kpi-card-head">
        {icon ? (
          <span className="kpi-card-icon" aria-hidden>
            <CardIcon name={icon} />
          </span>
        ) : null}
        <div className="kpi-card-title">{title}</div>
      </div>
      <div className="kpi-card-main">
        <div className="kpi-card-copy">
          <div className="kpi-card-value-row">
            <div className="kpi-card-value">{value}</div>
            {delta ? <div className={`kpi-delta tone-${tone}`}>{delta}</div> : null}
          </div>
          {subtitle ? <div className="kpi-card-sub">{subtitle}</div> : null}
          {detail ? <div className="kpi-card-sub">{detail}</div> : null}
        </div>
        {showSpark ? <Sparkline values={spark!} tone={tone} /> : null}
      </div>
      {percent != null && (
        <div className="kpi-track-row" aria-hidden>
          <div className="kpi-track">
            <span className="kpi-track-fill" style={{ width: `${bar}%`, background: barColor }} />
          </div>
          <span className="kpi-track-pct">{Math.round(bar)}%</span>
        </div>
      )}
      {onOpen ? <span className="open-hint">Ver detalle →</span> : null}
    </article>
  )
}

export function sparkDeltaPp(values: number[], vs = 'vs mes anterior'): { tone: 'ok' | 'bad' | 'neutral'; label: string } | null {
  if (values.length < 2) return null
  const diff = values[values.length - 1] - values[values.length - 2]
  const tone = diff > 0 ? 'ok' : diff < 0 ? 'bad' : 'neutral'
  const sign = diff > 0 ? '▲ +' : diff < 0 ? '▼ ' : '● '
  return { tone, label: `${sign}${Math.round(diff * 100)} pp ${vs}` }
}

export function sparkDeltaPct(values: number[], vs = 'vs foto anterior'): { tone: 'ok' | 'bad' | 'neutral'; label: string } | null {
  if (values.length < 2) return null
  const prev = values[values.length - 2]
  const last = values[values.length - 1]
  const diff = prev === 0 ? 0 : (last - prev) / Math.abs(prev)
  const tone = last > prev ? 'ok' : last < prev ? 'bad' : 'neutral'
  const sign = last > prev ? '▲ +' : last < prev ? '▼ ' : '● '
  return { tone, label: `${sign}${Math.round(diff * 100)}% ${vs}` }
}
