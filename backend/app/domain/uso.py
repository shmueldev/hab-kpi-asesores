from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, Field

try:
    BOGOTA = ZoneInfo("America/Bogota")
except ZoneInfoNotFoundError:
    BOGOTA = timezone(timedelta(hours=-5))
USO_TTL_DAYS = 90
PATH_MAX = 8

UsoScreen = Literal[
    "login",
    "home",
    "cumplimiento",
    "crecimiento",
    "autogestion",
    "cartera",
    "pedidos",
    "chat",
]

SCREENS: tuple[UsoScreen, ...] = (
    "login",
    "home",
    "cumplimiento",
    "crecimiento",
    "autogestion",
    "cartera",
    "pedidos",
    "chat",
)


def today_bogota() -> date:
    return datetime.now(BOGOTA).date()


def parse_screen(raw: str) -> UsoScreen | None:
    value = (raw or "").strip().lower()
    return value if value in SCREENS else None


class UsoPing(BaseModel):
    screen: str = Field(..., min_length=1, max_length=40)


class UsoUserDay(BaseModel):
    username: str
    nombre: str | None = None
    role: str = "asesor"
    last_at: str | None = None
    screens: dict[str, int] = Field(default_factory=dict)
    path: list[str] = Field(default_factory=list)

    def hits(self) -> int:
        return sum(self.screens.values())

    def bump(self, screen: UsoScreen, *, nombre: str | None, role: str) -> None:
        self.nombre = nombre or self.nombre
        self.role = role or self.role
        self.screens[screen] = int(self.screens.get(screen) or 0) + 1
        self.last_at = datetime.now(timezone.utc).isoformat()
        if not self.path or self.path[-1] != screen:
            self.path.append(screen)
            self.path = self.path[-PATH_MAX:]


class UsoDayReport(BaseModel):
    fecha: date
    redis: bool = False
    usuarios: list[UsoUserDay] = Field(default_factory=list)
    total_hits: int = 0
    activos: int = 0
