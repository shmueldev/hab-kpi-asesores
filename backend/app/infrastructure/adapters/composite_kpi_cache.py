import logging

from app.domain.models import Asesor, KpiDashboard, KpiFilter
from app.domain.ports.kpi_cache_port import KpiCachePort

logger = logging.getLogger(__name__)


class CompositeKpiCache(KpiCachePort):
    """Capas en orden: memoria → disco → Redis. Redis caído no impide servir una clave ya vista."""

    def __init__(self, primary: KpiCachePort, secondary: KpiCachePort, *more: KpiCachePort) -> None:
        self._layers = (primary, secondary, *more)
        self._primary = primary
        self._secondary = secondary

    def save_kpis(self, filters: KpiFilter, dashboard: KpiDashboard) -> None:
        for layer in self._layers:
            try:
                layer.save_kpis(filters, dashboard)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Capa de caché no guardó KPIs: %s", exc)

    def get_exact_kpis(self, filters: KpiFilter) -> KpiDashboard | None:
        for index, layer in enumerate(self._layers):
            try:
                hit = layer.get_exact_kpis(filters)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Capa de caché no leyó KPIs exactos: %s", exc)
                continue
            if hit is None:
                continue
            for faster in self._layers[:index]:
                try:
                    faster.save_kpis(filters, hit)
                except Exception as exc:  # noqa: BLE001
                    logger.warning("No se promovió el snapshot a capa rápida: %s", exc)
            return hit
        return None

    def get_kpis(self, filters: KpiFilter) -> KpiDashboard | None:
        exact = self.get_exact_kpis(filters)
        if exact is not None:
            return exact
        for layer in self._layers:
            try:
                hit = layer.get_kpis(filters)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Capa de caché no leyó KPIs: %s", exc)
                continue
            if hit is not None:
                return hit
        return None

    def save_asesores(self, items: list[Asesor]) -> None:
        for layer in self._layers:
            try:
                layer.save_asesores(items)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Capa de caché no guardó asesores: %s", exc)

    def get_asesores(self) -> list[Asesor] | None:
        for layer in self._layers:
            try:
                hit = layer.get_asesores()
            except Exception:  # noqa: BLE001
                continue
            if hit is not None:
                return hit
        return None

    def ping(self) -> bool:
        return self._layers[-1].ping()
