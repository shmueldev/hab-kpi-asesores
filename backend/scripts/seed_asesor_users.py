"""Crea usuarios de asesor desde dbo.dim_asesor.

Conserva admin y cualquiera que ya exista (clave y must_change_password).
Los nuevos entran con GENERIC_TEMP_PASSWORD y deben cambiarla.

  cd backend
  uv run python scripts/seed_asesor_users.py
"""

from __future__ import annotations

import json
import os
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

load_dotenv(ROOT / ".env", override=True)
load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)

from app.domain.vendedor import pick_vendedor  # noqa: E402
from app.infrastructure.database.db import get_connection  # noqa: E402
from app.infrastructure.security import hash_password  # noqa: E402

USERS_PATH = Path(os.getenv("USERS_FILE", "") or Path(__file__).resolve().parents[1] / "config" / "users.json")
GENERIC = os.getenv("GENERIC_TEMP_PASSWORD", "HabKpi.2026")

_SKIP = re.compile(
    r"generico|temporal|sin vendedor|b2c|scott|junior|_inactivo_|asesor junior|"
    r"ha bicicletas|medellin\s*\d",
    re.IGNORECASE,
)
_SKIP_KEYS = {0, 5, 300, 500, 999}
_SECOND = frozenset(
    {
        "ADOLFO",
        "ALBERTO",
        "ALEXIS",
        "ALEJANDRO",
        "ANDERZON",
        "ALEXANDER",
        "ALEXANDRA",
        "ALFREDO",
        "ALONSO",
        "ANDRES",
        "ANGEL",
        "ANTONIO",
        "ARLEY",
        "BRAJHAM",
        "CAMILO",
        "CARLOS",
        "DANIEL",
        "DARIO",
        "DAVID",
        "EDISON",
        "EDUARDO",
        "EFRAIN",
        "ELIANA",
        "ELIAS",
        "ENRIQUE",
        "ESTEBAN",
        "ESTIWAR",
        "EVELIO",
        "FELIPE",
        "FERNANDA",
        "FERNANDO",
        "FRANCISCO",
        "GERARDO",
        "GIOVANNA",
        "GONZALO",
        "GUILLERMO",
        "HENRY",
        "HERNAN",
        "HERNANDO",
        "HERNESTO",
        "HUGO",
        "JAIRO",
        "JAIR",
        "JESUS",
        "JOSE",
        "LEON",
        "LUCIA",
        "LUIS",
        "MARIA",
        "MARIO",
        "MIGUEL",
        "NEL",
        "NICOLAS",
        "NORELI",
        "ORLANDO",
        "PATRICIA",
        "RAFAEL",
        "RICARDO",
        "ROBERTO",
        "ROCIO",
        "VIVIANA",
        "WILLIAM",
        "YANETH",
        "YESID",
        "YIMI",
    }
)
_STOP = frozenset({"DE", "DEL", "LA", "LAS", "LOS", "Y", "DA", "DO", "SAN", "SANTA"})


def fold(text: str) -> str:
    raw = unicodedata.normalize("NFKD", text or "")
    return "".join(ch for ch in raw if not unicodedata.combining(ch))


def tokens(nombre: str) -> list[str]:
    clean = re.sub(r"\d+", " ", fold(nombre).upper())
    clean = re.sub(r"[^A-Z]+", " ", clean)
    return [part for part in clean.split() if part and part not in _STOP]


def first_apellido(parts: list[str]) -> str:
    if len(parts) < 2:
        return parts[0] if parts else "asesor"
    idx = 1
    while idx < len(parts) - 1 and parts[idx] in _SECOND:
        idx += 1
    return parts[idx]


def username_for(nombre: str) -> str:
    parts = tokens(nombre)
    if not parts:
        return "asesor"
    letter = parts[0][0].lower()
    apellido = re.sub(r"[^a-z]", "", first_apellido(parts).lower())
    return f"{letter}{apellido}" or "asesor"


def skip_row(key: int, nombre: str) -> bool:
    if key in _SKIP_KEYS:
        return True
    return bool(_SKIP.search(nombre or ""))


def load_sql() -> tuple[list[tuple[int, str]], list[tuple[int, str]]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT asesor_key, nombre_asesor FROM dbo.dim_asesor ORDER BY nombre_asesor")
        asesores = [(int(row[0]), str(row[1] or "").strip()) for row in cursor.fetchall() if row[0] is not None]
        cursor.execute("SELECT vendedor_rowid, nombre_vendedor FROM dbo.dim_vendedor_unoee")
        vendedores = [(int(row[0]), str(row[1] or "")) for row in cursor.fetchall() if row[0] is not None]
    finally:
        conn.close()
    return asesores, vendedores


def unique_username(base: str, used: set[str], key: int) -> str:
    candidate = base
    if candidate not in used:
        return candidate
    candidate = f"{base}{key}"
    if candidate not in used:
        return candidate
    n = 2
    while f"{base}{n}" in used:
        n += 1
    return f"{base}{n}"


def main() -> None:
    asesores, vendedores = load_sql()
    raw = json.loads(USERS_PATH.read_text(encoding="utf-8")) if USERS_PATH.exists() else {"users": []}
    current = list(raw.get("users") or [])
    by_key = {item.get("asesor_key"): item for item in current if item.get("asesor_key") is not None}
    used = {str(item.get("username", "")).lower() for item in current}
    temp_hash = hash_password(GENERIC)
    added = 0
    updated = 0

    for key, nombre in asesores:
        if skip_row(key, nombre):
            continue
        match = pick_vendedor(nombre, vendedores)
        rowid = match.vendedor_rowid if match else None
        existing = by_key.get(key)
        if existing:
            existing["nombre"] = nombre
            existing["vendedor_rowid"] = rowid
            existing["role"] = "asesor"
            updated += 1
            continue
        user = unique_username(username_for(nombre), used, key)
        used.add(user)
        current.append(
            {
                "username": user,
                "password_hash": temp_hash,
                "role": "asesor",
                "asesor_key": key,
                "vendedor_rowid": rowid,
                "nombre": nombre,
                "must_change_password": True,
            }
        )
        added += 1
        print(f"+ {user:16} key={key:<4} rowid={rowid or '-':<8} {nombre}")

    USERS_PATH.parent.mkdir(parents=True, exist_ok=True)
    USERS_PATH.write_text(json.dumps({"users": current}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nListo: +{added} nuevos, {updated} actualizados (nombre/rowid). Archivo {USERS_PATH}")
    print(f"Clave temporal de los nuevos: {GENERIC}")


if __name__ == "__main__":
    main()
