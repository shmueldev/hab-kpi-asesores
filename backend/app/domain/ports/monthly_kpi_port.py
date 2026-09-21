from abc import ABC, abstractmethod

from app.domain.models import KpiFilter, KpiMonthlyBreakdown


class MonthlyKpiPort(ABC):
    @abstractmethod
    def get_monthly_breakdown(self, filters: KpiFilter) -> KpiMonthlyBreakdown:
        raise NotImplementedError
