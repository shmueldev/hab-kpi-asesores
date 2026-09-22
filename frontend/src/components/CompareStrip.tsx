import type { KpiDashboard } from '../api/client'
import { formatPct } from './KpiCharts'

type Props = {
  asesor: KpiDashboard
  equipo: KpiDashboard
  nombre: string
}

function row(label: string, a: number, e: number) {
  const delta = (a - e) * 100
  const tone = delta > 0 ? 'ok' : delta < 0 ? 'bad' : 'neutral'
  const sign = delta > 0 ? '+' : ''
  return { label, a, e, delta: `${sign}${Math.round(delta)} pp`, tone }
}

export default function CompareStrip({ asesor, equipo, nombre }: Props) {
  const rows = [
    row('Cumplimiento', asesor.pct_cumpl_presupuesto, equipo.pct_cumpl_presupuesto),
    row('Crecimiento', asesor.pct_crecimiento_dinero, equipo.pct_crecimiento_dinero),
    row('Autogestión', asesor.pct_autogestion, equipo.pct_autogestion),
  ]
  return (
    <section className="compare-strip neon-card">
      <p className="compare-title">
        {nombre} vs consolidado del equipo
      </p>
      <div className="compare-grid">
        {rows.map((item) => (
          <div key={item.label} className="compare-cell">
            <span className="compare-label">{item.label}</span>
            <strong>{formatPct(item.a)}</strong>
            <span className="muted">equipo {formatPct(item.e)}</span>
            <span className={`compare-delta tone-${item.tone}`}>{item.delta}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
