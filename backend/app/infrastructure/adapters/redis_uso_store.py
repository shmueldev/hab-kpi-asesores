from __future__ import annotations

import json
import logging
from datetime import date

from app.domain.ports.uso_port import UsoPort
from app.domain.uso import USO_TTL_DAYS, UsoUserDay

logger = logging.getLogger(__name__)


def _key(day: date) -> str:
    return f"uso:dia:{day.isoformat()}"


class RedisUsoStore(UsoPort):
    def __init__(self, url: str = "redis://127.0.0.1:6379/0") -> None:
        self._url = url
        self._client = None

    def _conn(self):
        if self._client is None:
            import redis

            self._client = redis.from_url(self._url, decode_responses=True, socket_timeout=2)
        return self._client

    def bump(self, day: date, row: UsoUserDay) -> None:
        try:
            client = self._conn()
            key = _key(day)
            client.hset(key, row.username, row.model_dump_json())
            client.expire(key, USO_TTL_DAYS * 86400)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis no guardó uso: %s", exc)
            self._client = None

    def get_day(self, day: date) -> tuple[bool, list[UsoUserDay]]:
        try:
            raw = self._conn().hgetall(_key(day))
            rows = [UsoUserDay.model_validate(json.loads(value)) for value in raw.values()]
            rows.sort(key=lambda item: (-item.hits(), item.username))
            return True, rows
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis no leyó uso: %s", exc)
            self._client = None
            return False, []
