import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { readTheme, theme } from '../theme'

function palette() {
  if (readTheme() === 'dark') {
    return {
      meta: '#8BC7F7',
      venta: '#5B8DEF',
      actual: '#8BC7F7',
      anterior: '#7EA4C8',
      part: '#8BC7F7',
      resto: '#0B31A5',
      track: '#0d2a6a',
    }
  }
  return {
    meta: theme.dataColors[2],
    venta: theme.accent,
    actual: theme.dataColors[0],
    anterior: theme.dataColors[1],
    part: theme.dataColors[0],
    resto: theme.dataColors[1],
    track: theme.rowAlt,
  }
}

const axis = { fill: 'currentColor', fontSize: 12 }
const grid = '#46647C'
const tooltipStyle = {
  background: 'var(--bg)',
  border: '1px solid var(--highlight)',
  color: 'var(--text)',
  borderRadius: 8,
}

function ChartShell({
  title,
  children,
  onOpen,
  tall,
}: {
  title: string
  children: ReactNode
  onOpen?: () => void
  tall?: boolean
}) {
  return (
    <div
      className={`chart-box neon-card${onOpen ? ' clickable' : ''}${tall ? ' tall' : ''}`}
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
      <h3>{title}</h3>
      {children}
      {onOpen ? <span className="open-hint">Ver detalle →</span> : null}
    </div>
  )
}

export function GaugeChart({
  title,
  percent,
  color,
  partLabel = 'Avance',
  restLabel = 'Falta',
  onOpen,
  height = 220,
}: {
  title: string
  percent: number
  color?: string
  partLabel?: string
  restLabel?: string
  onOpen?: () => void
  height?: number
}) {
  const filled = Math.max(0, Math.min(percent, 1))
  const data = [
    { name: partLabel, value: Math.max(0.01, filled * 100) },
    { name: restLabel, value: Math.max(0.01, (1 - filled) * 100) },
  ]
  const angle = 180 - filled * 180
  const rad = (angle * Math.PI) / 180
  const hubX = 50
  const hubY = 70
  const needle = 32
  return (
    <ChartShell title={title} onOpen={onOpen}>
      <div className="chart-inner gauge-inner">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="70%"
              innerRadius="52%"
              outerRadius="80%"
              startAngle={180}
              endAngle={0}
              stroke="none"
            >
              <Cell fill={color || palette().part} />
              <Cell fill={palette().resto} />
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${Number(v).toFixed(1)}%`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <svg className="gauge-needle" viewBox="0 0 100 100" aria-hidden>
          <circle cx={hubX} cy={hubY} r="2.4" fill="currentColor" />
          <line
            x1={hubX}
            y1={hubY}
            x2={hubX + needle * Math.cos(rad)}
            y2={hubY - needle * Math.sin(rad)}
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <div className="chart-center-label gauge-label">{(percent * 100).toFixed(1)}%</div>
      </div>
    </ChartShell>
  )
}

export function MixDonutChart({
  title,
  part,
  total,
  partLabel,
  restLabel = 'Resto',
  centerLabel,
  onOpen,
  height = 200,
}: {
  title: string
  part: number
  total: number
  partLabel: string
  restLabel?: string
  centerLabel?: string
  onOpen?: () => void
  height?: number
}) {
  const resto = Math.max(0, total - part)
  const data = [
    { name: partLabel, value: Math.max(0, part) },
    { name: restLabel, value: resto },
  ]
  const pct = total ? (part / total) * 100 : 0
  return (
    <ChartShell title={title} onOpen={onOpen}>
      <div className="chart-inner">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} stroke="none">
              <Cell fill={palette().part} />
              <Cell fill={palette().resto} />
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="chart-center-label">{centerLabel ?? `${pct.toFixed(1)}%`}</div>
      </div>
    </ChartShell>
  )
}

export function CompareBarChart({
  title,
  actual,
  anterior,
  onOpen,
  height = 220,
}: {
  title: string
  actual: number
  anterior: number
  onOpen?: () => void
  height?: number
}) {
  const data = [
    { name: 'Actual', valor: actual, fill: palette().actual },
    { name: 'Año ant.', valor: anterior, fill: palette().anterior },
  ]
  return (
    <ChartShell title={title} onOpen={onOpen}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="name" tick={axis} />
          <YAxis tick={axis} tickFormatter={(v) => compactMoney(v)} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
          <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

export function MetaCompareChart({
  title,
  meta,
  venta,
  onOpen,
  height = 220,
}: {
  title: string
  meta: number
  venta: number
  onOpen?: () => void
  height?: number
}) {
  const data = [
    { name: 'Meta', valor: meta },
    { name: 'Venta int.', valor: venta },
  ]
  return (
    <ChartShell title={title} onOpen={onOpen}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="name" tick={axis} />
          <YAxis tick={axis} tickFormatter={(v) => compactMoney(v)} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
          <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
            <Cell fill={palette().meta} />
            <Cell fill={palette().venta} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

export function NamedBarChart({
  title,
  items,
  onOpen,
  height = 220,
}: {
  title: string
  items: { name: string; value: number; color?: string }[]
  onOpen?: () => void
  height?: number
}) {
  const colors = [palette().actual, palette().anterior, palette().venta, palette().meta]
  return (
    <ChartShell title={title} onOpen={onOpen}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={items} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="name" tick={axis} />
          <YAxis tick={axis} tickFormatter={(v) => compactMoney(v)} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {items.map((d, i) => (
              <Cell key={d.name} fill={d.color || colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

export function SliceDonutChart({
  title,
  slices,
  onOpen,
  height = 200,
}: {
  title: string
  slices: { name: string; value: number; color?: string }[]
  onOpen?: () => void
  height?: number
}) {
  const colors = [theme.ok, theme.highlight, theme.bad, palette().resto]
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0)
  return (
    <ChartShell title={title} onOpen={onOpen}>
      <div className="chart-inner">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} stroke="none">
              {slices.map((d, i) => (
                <Cell key={d.name} fill={d.color || colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="chart-center-label">{total ? formatMoney(total) : '—'}</div>
      </div>
    </ChartShell>
  )
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

function compactMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} mil M`
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} M`
  return new Intl.NumberFormat('es-CO', { notation: 'compact' }).format(n)
}
