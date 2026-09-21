from abc import ABC, abstractmethod

from app.domain.models import Asesor, KpiDashboard, KpiFilter


class KpiCachePort(ABC):
    @abstractmethod
    def save_kpis(self, filters: KpiFilter, dashboard: KpiDashboard) -> None:
        raise NotImplementedError

    @abstractmethod
    def get_exact_kpis(self, filters: KpiFilter) -> KpiDashboard | None:
        """Solo la clave periodo + asesor. Sin fallback al último snapshot."""
        raise NotImplementedError

    @abstractmethod
    def get_kpis(self, filters: KpiFilter) -> KpiDashboard | None:
        """Exacto del filtro; si no hay, último snapshot de ese asesor."""
        raise NotImplementedError

    @abstractmethod
    def save_asesores(self, items: list[Asesor]) -> None:
        raise NotImplementedError

    @abstractmethod
    def get_asesores(self) -> list[Asesor] | None:
        raise NotImplementedError

    @abstractmethod
    def ping(self) -> bool:
        raise NotImplementedError
