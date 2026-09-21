from calendar import monthrange
from datetime import date

from app.domain.models import DataFuente, KpiMonthRow, KpiMonthlyBreakdown

MES_TEXTO = {
    1: "enero",
    2: "febrero",
    3: "marzo",
    4: "abril",
    5: "mayo",
    6: "junio",
    7: "julio",
    8: "agosto",
    9: "septiembre",
    10: "octubre",
    11: "noviembre",
    12: "diciembre",
}


def iter_months(fecha_ini: date, fecha_fin: date) -> list[tuple[int, int]]:
    year, month = fecha_ini.year, fecha_ini.month
    out: list[tuple[int, int]] = []
    while (year, month) <= (fecha_fin.year, fecha_fin.month):
        out.append((year, month))
        month += 1
        if month == 13:
            month = 1
            year += 1
    return out


def _ratio(num: float, den: float) -> float:
    if not den:
        return 0.0
    return num / den


def _proyeccion(venta_int: float, year: int, month: int, today: date, fecha_fin: date) -> float:
    days_in_month = monthrange(year, month)[1]
    month_end = date(year, month, days_in_month)
    if month_end > fecha_fin:
        elapsed = min(fecha_fin, today).day if (year, month) == (today.year, today.month) else fecha_fin.day
        if year == today.year and month == today.month:
            elapsed = min(today.day, fecha_fin.day)
        days = max(elapsed, 1)
        return venta_int / days * min(days_in_month, fecha_fin.day if fecha_fin.month == month and fecha_fin.year == year else days_in_month)
    if year == today.year and month == today.month:
        elapsed = max(today.day, 1)
        return venta_int / elapsed * days_in_month
    return venta_int


def compose_monthly(
    fecha_ini: date,
    fecha_fin: date,
    meta: dict[tuple[int, int], float],
    ventas: dict[tuple[int, int], tuple[float, float]],
    auto: dict[tuple[int, int], float],
    ventas_aa_por_mes: dict[int, float],
    today: date | None = None,
    fuente: DataFuente = "sql",
) -> KpiMonthlyBreakdown:
    today = today or date.today()
    filas: list[KpiMonthRow] = []
    run_act = 0.0
    run_aa = 0.0
    sum_venta = 0.0
    sum_int = 0.0
    sum_meta = 0.0
    sum_aa = 0.0
    sum_auto = 0.0
    sum_proy = 0.0

    for year, month in iter_months(fecha_ini, fecha_fin):
        total_ventas, venta_int = ventas.get((year, month), (0.0, 0.0))
        total_meta = meta.get((year, month), 0.0)
        venta_auto = auto.get((year, month), 0.0)
        ventas_aa = ventas_aa_por_mes.get(month, 0.0)
        run_act += total_ventas
        run_aa += ventas_aa
        proy = _proyeccion(venta_int, year, month, today, fecha_fin)
        filas.append(
            KpiMonthRow(
                anio=year,
                mes=month,
                mes_texto=MES_TEXTO[month],
                venta_actual=total_ventas,
                venta_int=venta_int,
                total_meta=total_meta,
                ventas_aa=ventas_aa,
                venta_autogestion=venta_auto,
                pct_cumplimiento=_ratio(venta_int, total_meta),
                pct_crecimiento=_ratio(total_ventas, ventas_aa) - 1 if ventas_aa else 0.0,
                pct_autogestion=_ratio(venta_auto, venta_int),
                acumulado_vs_aa=run_act - run_aa,
                proyeccion_cierre=proy,
            )
        )
        sum_venta += total_ventas
        sum_int += venta_int
        sum_meta += total_meta
        sum_aa += ventas_aa
        sum_auto += venta_auto
        sum_proy += proy

    total = KpiMonthRow(
        anio=fecha_ini.year,
        mes=0,
        mes_texto="total",
        venta_actual=sum_venta,
        venta_int=sum_int,
        total_meta=sum_meta,
        ventas_aa=sum_aa,
        venta_autogestion=sum_auto,
        pct_cumplimiento=_ratio(sum_int, sum_meta),
        pct_crecimiento=_ratio(sum_venta, sum_aa) - 1 if sum_aa else 0.0,
        pct_autogestion=_ratio(sum_auto, sum_int),
        acumulado_vs_aa=run_act - run_aa,
        proyeccion_cierre=sum_proy,
        es_total=True,
    )
    return KpiMonthlyBreakdown(filas=filas, total=total, fuente=fuente)
