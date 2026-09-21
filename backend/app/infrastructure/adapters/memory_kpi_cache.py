from datetime import datetime, timezone

from app.domain.models import Asesor, KpiDashboard, KpiFilter
from app.domain.ports.kpi_cache_port import KpiCachePort


def _last_key(asesor_key: int | None) -> str:
    return f"last:{asesor_key if asesor_key is not None else 'all'}"


def _exact_key(filters: KpiFilter) -> str:
    asesor = filters.asesor_key if filters.asesor_key is not None else "all"
    return (
        f"exact:{asesor}:{filters.fecha_ini}:{filters.fecha_fin}:"
        f"{filters.fecha_ini_aa}:{filters.fecha_fin_aa}"
    )


def _stamp(dashboard: KpiDashboard, filters: KpiFilter) -> KpiDashboard:
    copied = dashboard.model_copy(deep=True)
    copied.fuente = "redis"
    copied.guardado_en = datetime.now(timezone.utc)
    copied.periodo_guardado_ini = filters.fecha_ini
    copied.periodo_guardado_fin = filters.fecha_fin
    return copied


class MemoryKpiCache(KpiCachePort):
    def __init__(self) -> None:
        self.kpis: dict[str, KpiDashboard] = {}
        self.asesores: list[Asesor] | None = None

    def save_kpis(self, filters: KpiFilter, dashboard: KpiDashboard) -> None:
        stamped = _stamp(dashboard, filters)
        self.kpis[_exact_key(filters)] = stamped
        self.kpis[_last_key(filters.asesor_key)] = stamped

    def get_exact_kpis(self, filters: KpiFilter) -> KpiDashboard | None:
        return self.kpis.get(_exact_key(filters))

    def get_kpis(self, filters: KpiFilter) -> KpiDashboard | None:
        return self.get_exact_kpis(filters) or self.kpis.get(_last_key(filters.asesor_key))

    def save_asesores(self, items: list[Asesor]) -> None:
        self.asesores = list(items)

    def get_asesores(self) -> list[Asesor] | None:
        return list(self.asesores) if self.asesores is not None else None

    def ping(self) -> bool:
        return True
