from datetime import date

from app.domain.ports.uso_port import UsoPort
from app.domain.uso import UsoUserDay


class MemoryUsoStore(UsoPort):
    def __init__(self) -> None:
        self._days: dict[str, dict[str, UsoUserDay]] = {}

    def bump(self, day: date, row: UsoUserDay) -> None:
        bucket = self._days.setdefault(day.isoformat(), {})
        bucket[row.username] = row

    def get_day(self, day: date) -> tuple[bool, list[UsoUserDay]]:
        rows = list(self._days.get(day.isoformat(), {}).values())
        rows.sort(key=lambda item: (-item.hits(), item.username))
        return True, rows
