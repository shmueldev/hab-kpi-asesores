from datetime import date

from app.domain.models import KpiFilter, KpiMonthlyBreakdown
from app.domain.ports.monthly_kpi_port import MonthlyKpiPort
from app.use_cases.get_kpi_dashboard import same_day_prev_year


class GetKpiMonthly:
    def __init__(self, repository: MonthlyKpiPort) -> None:
        self._repository = repository

    def execute(
        self,
        fecha_ini: date,
        fecha_fin: date,
        asesor_key: int | None = None,
        fecha_ini_aa: date | None = None,
        fecha_fin_aa: date | None = None,
    ) -> KpiMonthlyBreakdown:
        filters = KpiFilter(
            fecha_ini=fecha_ini,
            fecha_fin=fecha_fin,
            fecha_ini_aa=fecha_ini_aa or same_day_prev_year(fecha_ini),
            fecha_fin_aa=fecha_fin_aa or same_day_prev_year(fecha_fin),
            asesor_key=asesor_key,
        )
        return self._repository.get_monthly_breakdown(filters)
