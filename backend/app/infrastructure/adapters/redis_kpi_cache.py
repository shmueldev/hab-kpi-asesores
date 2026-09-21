from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from app.domain.models import Asesor, KpiDashboard, KpiFilter
from app.domain.ports.kpi_cache_port import KpiCachePort

logger = logging.getLogger(__name__)

ASESORES_KEY = "kpi:asesores"


def _last_key(asesor_key: int | None) -> str:
    return f"kpi:last:{asesor_key if asesor_key is not None else 'all'}"


def _exact_key(filters: KpiFilter) -> str:
    asesor = filters.asesor_key if filters.asesor_key is not None else "all"
    return (
        f"kpi:exact:{asesor}:{filters.fecha_ini}:{filters.fecha_fin}:"
        f"{filters.fecha_ini_aa}:{filters.fecha_fin_aa}"
    )


def _serialize(dashboard: KpiDashboard, filters: KpiFilter) -> str:
    payload = dashboard.model_copy(deep=True)
    payload.fuente = "redis"
    payload.guardado_en = datetime.now(timezone.utc)
    payload.periodo_guardado_ini = filters.fecha_ini
    payload.periodo_guardado_fin = filters.fecha_fin
    return payload.model_dump_json()


def _deserialize(raw: str) -> KpiDashboard:
    data = json.loads(raw)
    data["fuente"] = "redis"
    return KpiDashboard.model_validate(data)


class RedisKpiCache(KpiCachePort):
    def __init__(self, url: str = "redis://127.0.0.1:6379/0") -> None:
        self._url = url
        self._client = None

    def _conn(self):
        if self._client is None:
            import redis

            self._client = redis.from_url(self._url, decode_responses=True, socket_timeout=2)
        return self._client

    def save_kpis(self, filters: KpiFilter, dashboard: KpiDashboard) -> None:
        try:
            raw = _serialize(dashboard, filters)
            client = self._conn()
            client.set(_exact_key(filters), raw)
            client.set(_last_key(filters.asesor_key), raw)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis no guardó KPIs: %s", exc)
            self._client = None

    def get_exact_kpis(self, filters: KpiFilter) -> KpiDashboard | None:
        try:
            raw = self._conn().get(_exact_key(filters))
            if not raw:
                return None
            return _deserialize(raw)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis no leyó KPIs exactos: %s", exc)
            self._client = None
            return None

    def get_kpis(self, filters: KpiFilter) -> KpiDashboard | None:
        try:
            client = self._conn()
            raw = client.get(_exact_key(filters)) or client.get(_last_key(filters.asesor_key))
            if not raw:
                return None
            return _deserialize(raw)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis no leyó KPIs: %s", exc)
            self._client = None
            return None

    def save_asesores(self, items: list[Asesor]) -> None:
        try:
            payload = json.dumps([a.model_dump() for a in items])
            self._conn().set(ASESORES_KEY, payload)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis no guardó asesores: %s", exc)
            self._client = None

    def get_asesores(self) -> list[Asesor] | None:
        try:
            raw = self._conn().get(ASESORES_KEY)
            if not raw:
                return None
            return [Asesor.model_validate(item) for item in json.loads(raw)]
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis no leyó asesores: %s", exc)
            self._client = None
            return None

    def ping(self) -> bool:
        try:
            return bool(self._conn().ping())
        except Exception:  # noqa: BLE001
            self._client = None
            return False
