import type { KpiDashboard } from '../api/client'
import { formatMoney, formatPct } from '../components/KpiCharts'

function pct(n: number) {
  return formatPct(n)
}

export function localKpiReply(
  question: string,
  snap: KpiDashboard | null,
  periodLabel: string,
): string {
  if (!snap) {
    return (
      'No hay un snapshot de KPI cargado en esta sesión. ' +
      'Carga un periodo en el tablero; el chat sigue abierto a la derecha.'
    )
  }

  const q = question.toLowerCase()
  const asesor = snap.asesor_nombre || (snap.asesor_key != null ? `asesor ${snap.asesor_key}` : 'visión consolidada')
  const fuente =
    snap.fuente === 'sql' ? 'consulta en vivo a bdhabEngineer' : snap.fuente === 'redis' ? 'snapshot en caché' : 'demostración'

  const cumpl = `Cumplimiento ${pct(snap.pct_cumpl_presupuesto)} = venta internacional ${formatMoney(snap.venta_int)} ÷ meta ${formatMoney(snap.total_meta)}.`
  const crec = `Crecimiento ${pct(snap.pct_crecimiento_dinero)} = (ventas ${formatMoney(snap.total_ventas)} ÷ ventas año anterior ${formatMoney(snap.ventas_aa)}) − 1.`
  const auto = `Autogestión ${pct(snap.pct_autogestion)} = venta autogestión ${formatMoney(snap.venta_autogestion)} ÷ venta internacional ${formatMoney(snap.venta_int)}.`

  if (/cumpl/.test(q) || /meta|presupuesto/.test(q)) {
    return `Periodo ${periodLabel} · ${asesor}. ${cumpl} Esta cifra sale del snapshot actual (${fuente}), no de un modelo en vivo.`
  }
  if (/crec|año ant|aa\b/.test(q)) {
    return `Periodo ${periodLabel} · ${asesor}. ${crec} Esta cifra sale del snapshot actual (${fuente}), no de un modelo en vivo.`
  }
  if (/autogest/.test(q) || /canal/.test(q)) {
    return `Periodo ${periodLabel} · ${asesor}. ${auto} Esta cifra sale del snapshot actual (${fuente}), no de un modelo en vivo.`
  }
  if (/f[oó]rmula|c[aá]lculo|c[oó]mo se/.test(q)) {
    return (
      `Fórmulas del tablero (${periodLabel}): ` +
      `1) cumplimiento = venta internacional ÷ meta. ` +
      `2) crecimiento = (ventas actuales ÷ ventas del mismo periodo del año anterior) − 1. ` +
      `3) autogestión = venta autogestión ÷ venta internacional.`
    )
  }

  if (snap.vacio) {
    return `El snapshot de ${periodLabel} (${asesor}) está vacío: no hay meta ni ventas en ese filtro. Cambia el periodo o el asesor en el tablero.`
  }

  return (
    `Ayuda local con el snapshot de ${periodLabel} (${asesor}, ${fuente}). ` +
    `${cumpl} ${crec} ${auto} ` +
    'Pregunta por un KPI, la fórmula o el periodo. No hay un modelo de lenguaje en vivo en este momento.'
  )
}
