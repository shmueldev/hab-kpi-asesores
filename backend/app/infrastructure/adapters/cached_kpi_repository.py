import logging

from app.domain.errors import CatalogUnavailable, KpiDataUnavailable
from app.domain.models import Asesor, KpiDashboard, KpiFilter
from app.domain.ports.advisor_repository_port import AdvisorRepositoryPort
from app.domain.ports.kpi_cache_port import KpiCachePort
from app.domain.ports.kpi_repository_port import KpiRepositoryPort

logger = logging.getLogger(__name__)


class CachedKpiRepository(KpiRepositoryPort, AdvisorRepositoryPort):
    """Read-through por periodo+asesor. SQL solo si esa clave no está. Nunca inventa cifras."""

    def __init__(
        self,
        source: KpiRepositoryPort,
        cache: KpiCachePort,
        advisors: AdvisorRepositoryPort | None = None,
    ) -> None:
        self._source = source
        self._cache = cache
        self._advisors = advisors or (source if isinstance(source, AdvisorRepositoryPort) else None)

    def get_kpi_data(self, filters: KpiFilter) -> KpiDashboard:
        cached = self._cache.get_exact_kpis(filters)
        if cached is not None:
            cached.fuente = "redis"
            return cached
        try:
            dashboard = self._source.get_kpi_data(filters)
            dashboard.fuente = "sql"
            self._cache.save_kpis(filters, dashboard)
            return dashboard
        except Exception as exc:  # noqa: BLE001
            logger.warning("SQL KPI falló (%s). Buscando último dato en caché.", exc)
            fallback = self._cache.get_kpis(filters)
            if fallback is not None:
                fallback.fuente = "redis"
                return fallback
            raise KpiDataUnavailable(
                "No hay datos en bdhabEngineer ni un snapshot guardado para ese filtro."
            ) from exc

    def list_asesores(self) -> list[Asesor]:
        if self._advisors is None:
            raise CatalogUnavailable("No hay repositorio de asesores configurado.")
        try:
            items = self._advisors.list_asesores()
            self._cache.save_asesores(items)
            return items
        except Exception as exc:  # noqa: BLE001
            logger.warning("SQL dim_asesor falló (%s). Usando catálogo en caché.", exc)
            cached = self._cache.get_asesores()
            if cached is not None:
                return cached
            raise CatalogUnavailable(
                "No hay catálogo de asesores en SQL ni en caché."
            ) from exc

    def get_nombre(self, asesor_key: int) -> str | None:
        try:
            items = self.list_asesores()
        except CatalogUnavailable:
            return None
        for item in items:
            if item.asesor_key == asesor_key:
                return item.nombre
        return None
