"""Arma docs/usuarios.md desde users.json, sin hashes ni claves."""

from __future__ import annotations

import json
import re
from pathlib import Path

USERS = Path(__file__).resolve().parents[1] / "config" / "users.json"
OUT = Path(__file__).resolve().parents[2] / "docs" / "usuarios.md"


def clean(name: str) -> str:
    text = re.sub(r"\s+", " ", name or "").strip()
    return re.sub(r"\s+\d+$", "", text)


def main() -> None:
    users = json.loads(USERS.read_text(encoding="utf-8"))["users"]
    users = sorted(
        users,
        key=lambda item: (
            0 if item.get("role") == "admin" else 1,
            (item.get("nombre") or item["username"]).upper(),
            item["username"],
        ),
    )
    lines = [
        "# Usuarios y contraseñas",
        "",
        "## Convención",
        "",
        "- **Usuario:** inicial del primer nombre + primer apellido, minúsculas, sin tildes (`fcastro`, `aquiceno`).",
        "- **Clave temporal de los nuevos:** `HabKpi.2026`. Al entrar deben cambiarla.",
        "- Castro y admin ya tienen clave propia; no se pisan al sembrar.",
        "- Recuperar: usuario + número de asesor (`asesor_key`).",
        "- Si dos nombres chocan, se agrega el key (`jmontoya51`).",
        "",
        "Para regenerar la nómina desde SQL (no pisa claves existentes):",
        "",
        "```",
        "cd backend",
        "uv run python scripts/seed_asesor_users.py",
        "uv run python scripts/write_usuarios_md.py",
        "```",
        "",
        "No se crean genéricos, junior, B2C, inactivos ni `Sin Vendedor`.",
        "Cartera UnoEE cruza por nombre (`vendedor_rowid`); Siesa usa `codigo_vendedor = asesor_key`.",
        "Si `rowid` va vacío, UnoEE sale en blanco. El asesor nunca ve consolidado.",
        "",
        f"## Directorio ({len(users)} cuentas)",
        "",
        "| Usuario | Rol | asesor_key | UnoEE rowid | Nombre |",
        "|---------|-----|------------|-------------|--------|",
    ]
    for item in users:
        key = item.get("asesor_key")
        rowid = item.get("vendedor_rowid")
        lines.append(
            "| {user} | {role} | {key} | {rowid} | {nombre} |".format(
                user=item["username"],
                role=item["role"],
                key="—" if key is None else key,
                rowid="—" if rowid in (None, -1) else rowid,
                nombre=clean(item.get("nombre") or ""),
            )
        )
    lines.append("")
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Escrito {OUT} ({len(users)} filas)")


if __name__ == "__main__":
    main()
