import { theme } from '../theme'

type Props = {
  title: string
  value: string
  subtitle?: string
  detail?: string
  percent?: number
  tone?: 'ok' | 'bad' | 'neutral'
  onOpen?: () => void
  tour?: string
}

export default function KpiCard({
  title,
  value,
  subtitle,
  detail,
  percent,
  tone = 'neutral',
  onOpen,
  tour,
}: Props) {
  const bar = percent == null ? 0 : Math.max(0, Math.min(Math.abs(percent) * 100, 100))
  const barColor = tone === 'ok' ? theme.ok : tone === 'bad' ? theme.bad : theme.highlight

  return (
    <article
      data-tour={tour}
      className={`kpi-card neon-card tone-${tone}${onOpen ? ' clickable' : ''}`}
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
      <div className="kpi-card-title">{title}</div>
      <div className="kpi-card-value" style={{ color: barColor }}>
        {value}
      </div>
      {subtitle ? <div className="kpi-card-sub">{subtitle}</div> : null}
      {detail ? <div className="kpi-card-sub">{detail}</div> : null}
      {percent != null && (
        <div className="kpi-track" aria-hidden>
          <span className="kpi-track-fill" style={{ width: `${bar}%`, background: barColor }} />
        </div>
      )}
      {onOpen ? <span className="open-hint">Ver detalle →</span> : null}
    </article>
  )
}
