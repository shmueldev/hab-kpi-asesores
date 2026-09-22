import { useEffect, useState, type ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { readTheme, theme } from '../theme'

function useChartPalette() {
  const [mode, setMode] = useState(readTheme)
  useEffect(() => {
    const sync = () => setMode(readTheme())
    window.addEventListener('kpi-theme', sync)
    return () => window.removeEventListener('kpi-theme', sync)
  }, [])
  return paletteFor(mode)
}

function palette() {
  return paletteFor(readTheme())
}

function paletteFor(mode: ReturnType<typeof readTheme>) {
  if (mode === 'dark') {
    return {
      meta: '#94a3b8',
      venta: '#60a5fa',
      actual: '#1d4ed8',
      anterior: '#93c5fd',
      part: '#2563eb',
      resto: '#93c5fd',
      track: '#1e293b',
      grid: '#1e293b',
      fill: 'rgba(96, 165, 250, 0.2)',
      stack1: '#1e3a8a',
      stack2: '#2563eb',
      stack3: '#93c5fd',
      ok: '#22c55e',
      bad: '#f43f5e',
    }
  }
  return {
    meta: '#94a3b8',
    venta: '#2563eb',
    actual: '#1e3a8a',
    anterior: '#93c5fd',
    part: '#2563eb',
    resto: '#93c5fd',
    track: '#eef2f7',
    grid: '#e2e8f0',
    fill: 'rgba(37, 99, 235, 0.12)',
    stack1: '#1e3a8a',
    stack2: '#2563eb',
    stack3: '#93c5fd',
    ok: '#168980',
    bad: '#bb4a4a',
  }
}

const axis = { fill: 'currentColor', fontSize: 12 }
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
  useChartPalette()
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
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${Math.round(Number(v))}%`} />
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
        <div className="chart-center-label gauge-label">{Math.round(percent * 100)}%</div>
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
    { name: partLabel, value: Math.max(0, part), color: palette().part },
    { name: restLabel, value: resto, color: palette().resto },
  ]
  const pct = total ? (part / total) * 100 : 0
  return (
    <ChartShell title={title} onOpen={onOpen}>
      <div className="donut-layout">
        <div className="chart-inner donut-plot">
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} stroke="none" paddingAngle={2}>
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-center-label">{centerLabel ?? `${Math.round(pct)}%`}</div>
        </div>
        <ul className="donut-legend">
          {data.map((d) => {
            const share = total ? (d.value / total) * 100 : 0
            return (
              <li key={d.name}>
                <span className="donut-swatch" style={{ background: d.color }} />
                <span>{d.name}</span>
                <strong>{Math.round(share)}%</strong>
              </li>
            )
          })}
        </ul>
      </div>
    </ChartShell>
  )
}

export function TrendLineChart({
  title,
  points,
  onOpen,
  height = 240,
}: {
  title: string
  points: { name: string; venta: number; meta: number }[]
  onOpen?: () => void
  height?: number
}) {
  const colors = palette()
  return (
    <ChartShell title={title} onOpen={onOpen}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ventaArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.venta} stopOpacity={0.35} />
              <stop offset="100%" stopColor={colors.venta} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={colors.grid} vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} tickFormatter={(v) => compactMoney(v)} width={52} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
          <Legend />
          <Area type="monotone" dataKey="venta" stroke="none" fill="url(#ventaArea)" legendType="none" tooltipType="none" />
          <Line type="monotone" dataKey="venta" name="Venta int." stroke={colors.venta} strokeWidth={2.4} dot={{ r: 3, fill: colors.venta, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="meta" name="Meta" stroke={colors.meta} strokeWidth={1.8} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

export function MonthBarChart({
  title,
  points,
  onOpen,
  height = 240,
}: {
  title: string
  points: { name: string; actual: number; anterior: number }[]
  onOpen?: () => void
  height?: number
}) {
  const colors = palette()
  return (
    <ChartShell title={title} onOpen={onOpen}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barGap={6} barCategoryGap="32%">
          <CartesianGrid stroke={colors.grid} vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} tickFormatter={(v) => compactMoney(v)} width={52} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
          <Legend />
          <Bar dataKey="actual" name="Actual" fill={colors.actual} radius={[6, 6, 0, 0]} maxBarSize={26} />
          <Bar dataKey="anterior" name="Año ant." fill={colors.anterior} radius={[6, 6, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

export function HorizontalBarsChart({
  title,
  items,
  onOpen,
  height = 240,
  labelWidth = 86,
}: {
  title: string
  items: { name: string; value: number; color?: string }[]
  onOpen?: () => void
  height?: number
  labelWidth?: number
}) {
  const colors = palette()
  const fills = [colors.stack1, colors.stack2, colors.stack3, colors.venta]
  const total = items.reduce((s, d) => s + Math.max(0, d.value), 0)
  const rows = items.map((d) => ({ ...d, share: total ? d.value / total : 0 }))
  return (
    <ChartShell title={title} onOpen={onOpen}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 44, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={colors.grid} horizontal={false} strokeDasharray="3 6" />
          <XAxis type="number" tick={axis} tickFormatter={(v) => compactMoney(v)} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={axis} width={labelWidth} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={18} background={{ fill: colors.track, radius: 8 }}>
            {rows.map((d, i) => (
              <Cell key={d.name} fill={d.color || fills[i % fills.length]} />
            ))}
            <LabelList dataKey="share" position="right" formatter={(v: number) => `${Math.round(v * 100)}%`} fill="currentColor" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

export function StackedShareChart({
  title,
  points,
  keys,
  onOpen,
  height = 240,
}: {
  title: string
  points: Record<string, string | number>[]
  keys: { key: string; color?: string }[]
  onOpen?: () => void
  height?: number
}) {
  const colors = palette()
  const fills = [colors.stack1, colors.stack2, colors.stack3, colors.venta]
  return (
    <ChartShell title={title} onOpen={onOpen}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="28%" stackOffset="expand">
          <CartesianGrid stroke={colors.grid} vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`} width={44} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: number, name: string) => [formatMoney(v), name]}
          />
          <Legend />
          {keys.map((item, i) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              stackId="share"
              fill={item.color || fills[i % fills.length]}
              radius={i === keys.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={28}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

export function ComboMonthChart({
  title,
  points,
  onOpen,
  height = 240,
}: {
  title: string
  points: { name: string; venta: number; meta: number }[]
  onOpen?: () => void
  height?: number
}) {
  const colors = palette()
  return (
    <ChartShell title={title} onOpen={onOpen}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="32%">
          <CartesianGrid stroke={colors.grid} vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} tickFormatter={(v) => compactMoney(v)} width={52} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
          <Legend />
          <Bar dataKey="venta" name="Venta int." fill={colors.actual} radius={[7, 7, 0, 0]} maxBarSize={26} />
          <Line type="monotone" dataKey="meta" name="Meta" stroke={colors.meta} strokeWidth={2.2} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
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
          <CartesianGrid stroke={palette().grid} vertical={false} />
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
          <CartesianGrid stroke={palette().grid} vertical={false} />
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
  asCount = false,
}: {
  title: string
  items: { name: string; value: number; color?: string }[]
  onOpen?: () => void
  height?: number
  asCount?: boolean
}) {
  const paletteColors = palette()
  const colors = [paletteColors.stack1, paletteColors.stack2, paletteColors.stack3, paletteColors.venta]
  const formatValue = (v: number) => (asCount ? new Intl.NumberFormat('es-CO').format(v) : formatMoney(v))
  return (
    <ChartShell title={title} onOpen={onOpen}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={items} margin={{ top: 8, right: 8, left: 8, bottom: 8 }} barCategoryGap="32%">
          <CartesianGrid stroke={paletteColors.grid} vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} tickFormatter={(v) => (asCount ? String(v) : compactMoney(v))} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatValue(v)} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={28}>
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

export function AreaPairChart({
  title,
  points,
  leftKey = 'venta',
  rightKey = 'meta',
  leftName = 'Venta',
  rightName = 'Meta',
  height = 280,
}: {
  title: string
  points: Record<string, string | number>[]
  leftKey?: string
  rightKey?: string
  leftName?: string
  rightName?: string
  height?: number
}) {
  const colors = palette()
  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={colors.grid} vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} tickFormatter={(v) => compactMoney(v)} width={52} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
          <Legend />
          <Area type="monotone" dataKey={rightKey} name={rightName} stroke={colors.meta} fill={colors.track} strokeWidth={2} />
          <Area type="monotone" dataKey={leftKey} name={leftName} stroke={colors.venta} fill={colors.fill} strokeWidth={2.2} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

export function MoneyLanesChart({
  title,
  items,
}: {
  title: string
  items: { name: string; value: number; tone?: 'ok' | 'bad' | 'neutral' }[]
}) {
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 1)
  return (
    <ChartShell title={title}>
      <ul className="money-lanes">
        {items.map((item) => (
          <li key={item.name}>
            <div className="money-lane-head">
              <span>{item.name}</span>
              <strong>{formatMoney(item.value)}</strong>
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
    </ChartShell>
  )
}

export function SignedBarChart({
  title,
  points,
  height = 280,
}: {
  title: string
  points: { name: string; value: number }[]
  height?: number
}) {
  const colors = palette()
  const rows = points.map((row) => ({ ...row, pct: Math.round(row.value * 100) }))
  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={colors.grid} vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} tickFormatter={(v) => `${v}%`} width={40} axisLine={false} tickLine={false} />
          <ReferenceLine y={0} stroke={colors.meta} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
          <Bar dataKey="pct" name="Crecimiento" radius={[6, 6, 0, 0]} maxBarSize={28}>
            {rows.map((row) => (
              <Cell key={row.name} fill={row.pct >= 0 ? colors.ok : colors.bad} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

export function ValueBarChart({
  title,
  points,
  height = 200,
  highlight = 'high',
}: {
  title: string
  points: { name: string; value: number }[]
  height?: number
  highlight?: 'high' | 'low' | null
}) {
  const colors = palette()
  const ranked = [...points].sort((a, b) => a.value - b.value)
  const highs = new Set(ranked.slice(-1).map((row) => row.name))
  const lows = new Set(ranked.slice(0, Math.min(3, ranked.length)).map((row) => row.name))
  return (
    <ChartShell title={title}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={colors.grid} vertical={false} strokeDasharray="3 6" />
          <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} tickFormatter={(v) => compactMoney(v)} width={52} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
          <Bar dataKey="value" name="Venta" radius={[6, 6, 0, 0]} maxBarSize={26}>
            {points.map((row) => {
              const mark =
                highlight === 'low' ? lows.has(row.name) : highlight === 'high' ? highs.has(row.name) : false
              return (
                <Cell
                  key={row.name}
                  fill={mark ? (highlight === 'low' ? colors.bad : colors.ok) : colors.venta}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
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
  return `${Math.round(n * 100)}%`
}

function compactMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `${Math.round(n / 1_000_000_000)} mil M`
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} M`
  return new Intl.NumberFormat('es-CO', { notation: 'compact' }).format(n)
}
