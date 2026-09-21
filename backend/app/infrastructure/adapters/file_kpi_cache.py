import json
from datetime import datetime, timezone
from pathlib import Path

from app.domain.models import Asesor, KpiDashboard, KpiFilter
from app.domain.ports.kpi_cache_port import KpiCachePort


def _last_name(asesor_key: int | None) -> str:
    return f"last-{asesor_key if asesor_key is not None else 'all'}.json"


def _exact_name(filters: KpiFilter) -> str:
    asesor = filters.asesor_key if filters.asesor_key is not None else "all"
    return (
        f"exact-{asesor}-{filters.fecha_ini}-{filters.fecha_fin}-"
        f"{filters.fecha_ini_aa}-{filters.fecha_fin_aa}.json"
    )


class FileKpiCache(KpiCachePort):
    def __init__(self, root: Path) -> None:
        self._root = root
        self._root.mkdir(parents=True, exist_ok=True)

    def _write(self, name: str, dashboard: KpiDashboard, filters: KpiFilter) -> None:
        payload = dashboard.model_copy(deep=True)
        payload.fuente = "redis"
        payload.guardado_en = datetime.now(timezone.utc)
        payload.periodo_guardado_ini = filters.fecha_ini
        payload.periodo_guardado_fin = filters.fecha_fin
        (self._root / name).write_text(payload.model_dump_json(), encoding="utf-8")

    def _read(self, name: str) -> KpiDashboard | None:
        path = self._root / name
        if not path.exists():
            return None
        data = json.loads(path.read_text(encoding="utf-8"))
        data["fuente"] = "redis"
        return KpiDashboard.model_validate(data)

    def save_kpis(self, filters: KpiFilter, dashboard: KpiDashboard) -> None:
        self._write(_exact_name(filters), dashboard, filters)
        self._write(_last_name(filters.asesor_key), dashboard, filters)

    def get_exact_kpis(self, filters: KpiFilter) -> KpiDashboard | None:
        return self._read(_exact_name(filters))

    def get_kpis(self, filters: KpiFilter) -> KpiDashboard | None:
        return self.get_exact_kpis(filters) or self._read(_last_name(filters.asesor_key))

    def save_asesores(self, items: list[Asesor]) -> None:
        (self._root / "asesores.json").write_text(
            json.dumps([a.model_dump() for a in items], ensure_ascii=False),
            encoding="utf-8",
        )

    def get_asesores(self) -> list[Asesor] | None:
        path = self._root / "asesores.json"
        if not path.exists():
            return None
        return [Asesor.model_validate(item) for item in json.loads(path.read_text(encoding="utf-8"))]

    def ping(self) -> bool:
        return self._root.exists()
