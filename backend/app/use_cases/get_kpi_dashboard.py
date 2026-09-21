from datetime import date

from app.domain.models import KpiDashboard, KpiFilter
from app.domain.ports.advisor_repository_port import AdvisorRepositoryPort
from app.domain.ports.kpi_repository_port import KpiRepositoryPort


def same_day_prev_year(d: date) -> date:
    try:
        return d.replace(year=d.year - 1)
    except ValueError:
        return d.replace(year=d.year - 1, day=28)


def mark_empty(dashboard: KpiDashboard) -> KpiDashboard:
    dashboard.vacio = (
        dashboard.total_meta == 0
        and dashboard.venta_int == 0
        and dashboard.total_ventas == 0
    )
    return dashboard


class GetKpiDashboard:
    def __init__(
        self,
        repository: KpiRepositoryPort,
        advisors: AdvisorRepositoryPort | None = None,
    ) -> None:
        self._repository = repository
        self._advisors = advisors

    def execute(
        self,
        fecha_ini: date,
        fecha_fin: date,
        asesor_key: int | None = None,
        fecha_ini_aa: date | None = None,
        fecha_fin_aa: date | None = None,
    ) -> KpiDashboard:
        ini_aa = fecha_ini_aa or same_day_prev_year(fecha_ini)
        fin_aa = fecha_fin_aa or same_day_prev_year(fecha_fin)
        filters = KpiFilter(
            fecha_ini=fecha_ini,
            fecha_fin=fecha_fin,
            fecha_ini_aa=ini_aa,
            fecha_fin_aa=fin_aa,
            asesor_key=asesor_key,
        )
        dashboard = self._repository.get_kpi_data(filters)
        dashboard.asesor_key = asesor_key
        if asesor_key is not None and self._advisors is not None:
            nombre = self._advisors.get_nombre(asesor_key)
            if nombre:
                dashboard.asesor_nombre = nombre
        return mark_empty(dashboard)
