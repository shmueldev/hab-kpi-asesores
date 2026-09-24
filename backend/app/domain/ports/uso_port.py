from abc import ABC, abstractmethod
from datetime import date

from app.domain.uso import UsoUserDay


class UsoPort(ABC):
    @abstractmethod
    def bump(self, day: date, row: UsoUserDay) -> None:
        raise NotImplementedError

    @abstractmethod
    def get_day(self, day: date) -> tuple[bool, list[UsoUserDay]]:
        raise NotImplementedError
