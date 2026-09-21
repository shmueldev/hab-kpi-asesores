from __future__ import annotations

import logging

from app.domain.ports.vendedor_map_port import VendedorMapPort
from app.domain.vendedor import VendedorMatch, pick_vendedor
from app.infrastructure.database.db import get_connection

logger = logging.getLogger(__name__)


class SqlVendedorMap(VendedorMapPort):
    """Cruza dim_asesor.nombre con dim_vendedor_unoee.nombre. Nunca vendedor_codigo."""

    def __init__(self) -> None:
        self._asesores: dict[int, str] | None = None
        self._vendedores: list[tuple[int, str]] | None = None

    def _load(self) -> None:
        if self._asesores is not None and self._vendedores is not None:
            return
        conn = get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT asesor_key, nombre_asesor FROM dbo.dim_asesor")
            self._asesores = {int(r[0]): str(r[1] or "") for r in cursor.fetchall() if r[0] is not None}
            cursor.execute("SELECT vendedor_rowid, nombre_vendedor FROM dbo.dim_vendedor_unoee")
            self._vendedores = [
                (int(r[0]), str(r[1] or "")) for r in cursor.fetchall() if r[0] is not None
            ]
        finally:
            conn.close()

    def resolve(self, asesor_key: int) -> VendedorMatch | None:
        try:
            self._load()
        except Exception as exc:  # noqa: BLE001
            logger.warning("No se pudo cargar el mapa asesor→vendedor: %s", exc)
            return None
        nombre = (self._asesores or {}).get(asesor_key)
        if not nombre:
            return None
        return pick_vendedor(nombre, self._vendedores or [])
