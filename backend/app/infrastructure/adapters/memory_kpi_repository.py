"""Repositorio demo en memoria. Los montos escalan con el rango de fechas."""

from app.domain.models import Asesor, KpiDashboard, KpiFilter, KpiMonthlyBreakdown
from app.domain.monthly import compose_monthly, iter_months
from app.domain.ports.advisor_repository_port import AdvisorRepositoryPort
from app.domain.ports.kpi_repository_port import KpiRepositoryPort
from app.domain.ports.monthly_kpi_port import MonthlyKpiPort

DEMO_ASESORES = [
    Asesor(asesor_key=146, nombre="Asesor demo"),
    Asesor(asesor_key=114, nombre="Alexis"),
    Asesor(asesor_key=201, nombre="Cartera Norte"),
]


class MemoryKpiRepository(KpiRepositoryPort, AdvisorRepositoryPort, MonthlyKpiPort):
    def get_kpi_data(self, filters: KpiFilter) -> KpiDashboard:
        days = max(1, (filters.fecha_fin - filters.fecha_ini).days + 1)
        scale = days / 365.0
        if filters.asesor_key is not None:
            scale *= 0.18

        total_meta = round(1_250_000_000.0 * scale, 2)
        venta_int = round(1_087_500_000.0 * scale, 2)
        total_ventas = round(1_050_000_000.0 * scale, 2)
        ventas_aa = round(920_000_000.0 * scale, 2)
        venta_autogestion = round(217_500_000.0 * scale, 2)

        pct_cumpl = (venta_int / total_meta) if total_meta else 0.0
        pct_crec = ((total_ventas / ventas_aa) - 1.0) if ventas_aa else 0.0
        pct_auto = (venta_autogestion / venta_int) if venta_int else 0.0

        return KpiDashboard(
            total_meta=total_meta,
            venta_int=venta_int,
            pct_cumpl_presupuesto=round(pct_cumpl, 4),
            total_ventas=total_ventas,
            ventas_aa=ventas_aa,
            pct_crecimiento_dinero=round(pct_crec, 4),
            venta_autogestion=venta_autogestion,
            pct_autogestion=round(pct_auto, 4),
            fuente="demo",
            asesor_key=filters.asesor_key,
            asesor_nombre=self.get_nombre(filters.asesor_key) if filters.asesor_key else None,
        )

    def get_monthly_breakdown(self, filters: KpiFilter) -> KpiMonthlyBreakdown:
        months = iter_months(filters.fecha_ini, filters.fecha_fin)
        n = max(len(months), 1)
        dash = self.get_kpi_data(filters)
        meta = {(y, m): dash.total_meta / n for y, m in months}
        ventas = {(y, m): (dash.total_ventas / n, dash.venta_int / n) for y, m in months}
        auto = {(y, m): dash.venta_autogestion / n for y, m in months}
        ventas_aa = {m: dash.ventas_aa / n for _y, m in months}
        return compose_monthly(
            filters.fecha_ini,
            filters.fecha_fin,
            meta,
            ventas,
            auto,
            ventas_aa,
            fuente="demo",
        )

    def list_asesores(self) -> list[Asesor]:
        return list(DEMO_ASESORES)

    def get_nombre(self, asesor_key: int) -> str | None:
        for item in DEMO_ASESORES:
            if item.asesor_key == asesor_key:
                return item.nombre
        return None
