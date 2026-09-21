from abc import ABC, abstractmethod

from app.domain.models import KpiDashboard, KpiFilter


class KpiRepositoryPort(ABC):
    """Puerto de acceso a datos de KPI."""

    @abstractmethod
    def get_kpi_data(self, filters: KpiFilter) -> KpiDashboard:
        """Obtiene el resumen de KPIs según filtros."""
        raise NotImplementedError
