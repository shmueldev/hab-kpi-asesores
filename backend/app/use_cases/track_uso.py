from datetime import date

from app.domain.models import UserInfo
from app.domain.ports.uso_port import UsoPort
from app.domain.uso import UsoDayReport, UsoScreen, UsoUserDay, today_bogota


class TrackUso:
    def __init__(self, store: UsoPort) -> None:
        self._store = store

    def ping(self, user: UserInfo, screen: UsoScreen, day: date | None = None) -> UsoUserDay:
        when = day or today_bogota()
        current = self._find(when, user.username) or UsoUserDay(
            username=user.username.lower(),
            nombre=user.nombre,
            role=user.role,
        )
        current.bump(screen, nombre=user.nombre, role=user.role)
        self._store.bump(when, current)
        return current

    def report(self, day: date | None = None) -> UsoDayReport:
        when = day or today_bogota()
        redis_ok, rows = self._store.get_day(when)
        return UsoDayReport(
            fecha=when,
            redis=redis_ok,
            usuarios=rows,
            total_hits=sum(row.hits() for row in rows),
            activos=len(rows),
        )

    def _find(self, day: date, username: str) -> UsoUserDay | None:
        _, rows = self._store.get_day(day)
        wanted = username.lower()
        for row in rows:
            if row.username.lower() == wanted:
                return row
        return None
