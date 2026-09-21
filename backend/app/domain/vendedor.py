from __future__ import annotations

import re
import unicodedata

from pydantic import BaseModel

NO_VENDEDOR_ROWID = -1
_STOP = frozenset({"DE", "DEL", "LA", "LAS", "LOS", "Y", "DA", "DO", "SAN", "SANTA"})


class VendedorMatch(BaseModel):
    vendedor_rowid: int
    nombre: str
    score: float = 0.0


def name_tokens(name: str | None) -> frozenset[str]:
    text = unicodedata.normalize("NFKD", name or "")
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.upper()
    text = re.sub(r"\d+", " ", text)
    text = re.sub(r"[^A-Z]+", " ", text)
    return frozenset(part for part in text.split() if len(part) >= 3 and part not in _STOP)


def match_score(left: frozenset[str], right: frozenset[str]) -> float:
    if not left or not right:
        return 0.0
    shared = left & right
    if len(shared) < 2:
        return 0.0
    return len(shared) / len(left | right)


def pick_vendedor(asesor_nombre: str | None, candidates: list[tuple[int, str]]) -> VendedorMatch | None:
    """Cruza dim_asesor ↔ dim_vendedor_unoee por nombre. No usa vendedor_codigo."""
    wanted = name_tokens(asesor_nombre)
    ranked: list[VendedorMatch] = []
    for rowid, nombre in candidates:
        score = match_score(wanted, name_tokens(nombre))
        if score > 0:
            ranked.append(VendedorMatch(vendedor_rowid=rowid, nombre=nombre, score=score))
    if not ranked:
        return None
    ranked.sort(key=lambda item: item.score, reverse=True)
    if len(ranked) > 1 and ranked[0].score == ranked[1].score:
        return None
    return ranked[0]


def resolve_cartera_keys(
    *,
    role: str,
    user_asesor_key: int | None,
    requested_asesor_key: int | None,
    mapped_rowid: int | None,
    override_rowid: int | None,
    query_rowid: int | None,
    query_codigo: str | None,
) -> tuple[int | None, str | None]:
    """asesor → su vendedor; admin con asesor → ese vendedor; admin sin filtro → query o todos."""
    asesor_key = user_asesor_key if role == "asesor" else requested_asesor_key
    if asesor_key is None:
        return query_rowid, query_codigo or None
    rowid = override_rowid if override_rowid is not None else mapped_rowid
    if rowid is None:
        rowid = NO_VENDEDOR_ROWID
    return rowid, str(asesor_key)
