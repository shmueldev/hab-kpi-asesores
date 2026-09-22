import type { KpiMonthRow, KpiMonthlyBreakdown } from '../api/client'
import { formatMoney, formatPct } from './KpiCharts'
import TableBanner from './TableBanner'
import TableCsvMenu from './TableCsvMenu'

export type KpiId = 'cumplimiento' | 'crecimiento' | 'autogestion'

type Col = {
  key: keyof KpiMonthRow
  label: string
  kind: 'text' | 'money' | 'pct'
}

const TITLES: Record<KpiId, string> = {
  cumplimiento: 'Avance mes a mes',
  crecimiento: 'Crecimiento mes a mes',
  autogestion: 'Autogestión mes a mes',
}

const COLS: Record<KpiId, Col[]> = {
  cumplimiento: [
    { key: 'anio', label: 'Año', kind: 'text' },
    { key: 'mes', label: 'Mes', kind: 'text' },
    { key: 'mes_texto', label: 'Mes texto', kind: 'text' },
    { key: 'venta_int', label: 'Venta int.', kind: 'money' },
    { key: 'total_meta', label: 'Total meta', kind: 'money' },
    { key: 'pct_cumplimiento', label: '% Cumple presupuesto', kind: 'pct' },
    { key: 'proyeccion_cierre', label: 'Proyección de cierre', kind: 'money' },
  ],
  crecimiento: [
    { key: 'anio', label: 'Año', kind: 'text' },
    { key: 'mes', label: 'Mes', kind: 'text' },
    { key: 'mes_texto', label: 'Mes texto', kind: 'text' },
    { key: 'venta_actual', label: 'Venta actual', kind: 'money' },
    { key: 'ventas_aa', label: 'Ventas año anterior', kind: 'money' },
    { key: 'pct_crecimiento', label: '% Crecimiento dinero', kind: 'pct' },
    { key: 'acumulado_vs_aa', label: 'Acumulado vs año anterior', kind: 'money' },
  ],
  autogestion: [
    { key: 'anio', label: 'Año', kind: 'text' },
    { key: 'mes', label: 'Mes', kind: 'text' },
    { key: 'mes_texto', label: 'Mes texto', kind: 'text' },
    { key: 'venta_autogestion', label: 'Venta autogestión', kind: 'money' },
    { key: 'venta_int', label: 'Venta int.', kind: 'money' },
    { key: 'pct_autogestion', label: '% Autogestión', kind: 'pct' },
  ],
}

function cell(row: KpiMonthRow, col: Col) {
  const raw = row[col.key]
  if (col.key === 'mes' && row.es_total) return ''
  if (col.key === 'anio' && row.es_total) return ''
  if (col.kind === 'money') return formatMoney(Number(raw))
  if (col.kind === 'pct') return formatPct(Number(raw))
  return String(raw)
}

function tone(row: KpiMonthRow, col: Col) {
  if (col.kind !== 'pct') return ''
  const n = Number(row[col.key])
  if (col.key === 'pct_cumplimiento') return n >= 1 ? 'ok' : 'bad'
  if (col.key === 'pct_crecimiento') return n >= 0 ? 'ok' : 'bad'
  return ''
}

export default function MonthlyKpiTable({
  kpi,
  data,
}: {
  kpi: KpiId
  data: KpiMonthlyBreakdown
}) {
  const cols = COLS[kpi]
  const rows = data.total ? [...data.filas, data.total] : data.filas
  return (
    <TableCsvMenu
      filename={TITLES[kpi]}
      headers={cols.map((col) => col.label)}
      rows={rows.map((row) =>
        cols.map((col) => (col.kind === 'text' ? cell(row, col) : Number(row[col.key]))),
      )}
    >
    <section className="month-table neon-card has-banner">
      <TableBanner
        title={TITLES[kpi]}
        description="Cada fila es un mes del periodo. Los montos salen de fact_ventas / fact_presupuesto. El total debe cuadrar con las tarjetas."
      />
      <div className="month-table-wrap">
        <table>
          <thead>
            <tr>
              {cols.map((col) => (
                <th key={col.key} className={col.kind === 'text' ? '' : 'num'}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.anio}-${row.mes}-${row.mes_texto}`} className={row.es_total ? 'is-total' : ''}>
                {cols.map((col) => (
                  <td key={col.key} className={`${col.kind === 'text' ? '' : 'num'} ${tone(row, col)}`}>
                    {cell(row, col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
    </TableCsvMenu>
  )
}
