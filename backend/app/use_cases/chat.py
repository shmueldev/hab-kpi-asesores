from __future__ import annotations

import json
import logging
import os
import re
import urllib.error
import urllib.request
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.domain.models import UserInfo

logger = logging.getLogger(__name__)

ChatSource = Literal["local", "rescue"]
ChatRole = Literal["admin", "asesor"]
VisualKind = Literal["lanes", "signed", "pills", "bars"]

_OTHER_SCOPE = re.compile(
    r"\b("
    r"otro[s]?\s+asesor|"
    r"asesores|"
    r"ranking|"
    r"consolidad[oa]|"
    r"todos\s+los|"
    r"el\s+equipo|"
    r"mi\s+equipo|"
    r"compa[nñ]ero|"
    r"qui[eé]n\s+va|"
    r"mejor\s+asesor|"
    r"peor\s+asesor|"
    r"promedio\s+del|"
    r"compar(ar|o)\s+con"
    r")\b",
    re.IGNORECASE,
)

RESCUE_DEFAULT_BASE = "https://llm.tirescue.com/v1"
RESCUE_ALIASES = frozenset(
    {
        "rescue-fast",
        "rescue-main",
        "rescue-vision",
        "rescue-reason",
        "rescue-backup",
        "rescue-cloud",
    }
)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    period_label: str | None = None
    snapshot: dict[str, Any] | None = None
    meses: list[dict[str, Any]] | None = None


class ChatVisualItem(BaseModel):
    name: str
    value: float
    tone: Literal["ok", "bad", "neutral"] = "neutral"
    kind: Literal["money", "pct"] = "money"


class ChatVisual(BaseModel):
    type: VisualKind
    title: str
    items: list[ChatVisualItem] = Field(default_factory=list)
    points: list[dict[str, Any]] = Field(default_factory=list)
    highlight: Literal["high", "low"] | None = None


class ChatResponse(BaseModel):
    reply: str
    source: ChatSource
    visuals: list[ChatVisual] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)


def _money(value: Any) -> str:
    try:
        return f"${float(value):,.0f}"
    except (TypeError, ValueError):
        return "n/d"


def _pct(value: Any) -> str:
    try:
        return f"{float(value) * 100:.1f}%"
    except (TypeError, ValueError):
        return "n/d"


def _num(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _month_rows(meses: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for row in meses or []:
        if row.get("es_total"):
            continue
        rows.append(row)
        if len(rows) >= 12:
            break
    return rows


def _month_payload(meses: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    packed: list[dict[str, Any]] = []
    for row in _month_rows(meses):
        packed.append(
            {
                "mes": str(row.get("mes_texto") or f"{row.get('anio')}-{row.get('mes')}"),
                "venta": _num(row.get("venta_actual") if row.get("venta_actual") is not None else row.get("venta_int")),
                "venta_int": _num(row.get("venta_int")),
                "meta": _num(row.get("total_meta")),
                "aa": _num(row.get("ventas_aa")),
                "pct_crecimiento": _num(row.get("pct_crecimiento")),
                "autogestion": _num(row.get("venta_autogestion")),
            }
        )
    return packed


def asks_month_detail(message: str) -> bool:
    question = (message or "").lower()
    return any(
        word in question
        for word in (
            "mes",
            "mensual",
            "vendí",
            "vendi",
            "vendiste",
            "más alto",
            "mas alto",
            "más bajo",
            "mas bajo",
            "pico",
            "desglose",
            "peor",
            "peores",
            "flojo",
            "débiles",
            "debiles",
        )
    )


def asks_worst_month(message: str) -> bool:
    question = (message or "").lower()
    return any(word in question for word in ("peor", "peores", "más bajo", "mas bajo", "flojo", "débiles", "debiles"))


def asks_advice(message: str) -> bool:
    question = (message or "").lower()
    return any(
        word in question
        for word in (
            "consejo",
            "mejorar",
            "prioridad",
            "qué hago",
            "que hago",
            "recomiend",
            "cómo mejoro",
            "como mejoro",
        )
    )


def _month_sale(row: dict[str, Any]) -> float:
    if row.get("venta_actual") is not None:
        return _num(row.get("venta_actual"))
    if row.get("venta") is not None:
        return _num(row.get("venta"))
    return _num(row.get("venta_int"))


def board_insights(snapshot: dict[str, Any] | None, meses: list[dict[str, Any]] | None) -> dict[str, Any]:
    months = _month_payload(meses)
    ranked = sorted(months, key=lambda row: row["venta"])
    worst = ranked[:3]
    best = ranked[-1] if ranked else None
    snap = snapshot or {}
    cumpl = _num(snap.get("pct_cumpl_presupuesto"))
    crec = _num(snap.get("pct_crecimiento_dinero"))
    auto = _num(snap.get("pct_autogestion"))
    gap = _num(snap.get("total_meta")) - _num(snap.get("venta_int"))
    tips: list[str] = []
    if cumpl < 1 and gap > 0:
        tips.append(f"Cerrar la brecha a meta: {_money(gap)} (vas {_pct(cumpl)}).")
    elif cumpl >= 1:
        tips.append("La meta ya está cubierta: priorizá crecimiento y mix de canal.")
    if crec < 0:
        tips.append(f"Crecimiento negativo {_pct(crec)}: recuperá los meses flojos frente al año anterior.")
    elif crec < 0.05:
        tips.append(f"Crecimiento plano {_pct(crec)}: acelerá para superar la base del año anterior.")
    else:
        tips.append(f"Crecimiento {_pct(crec)}: sostené el ritmo en los meses fuertes.")
    if auto < 0.4:
        tips.append(f"Autogestión {_pct(auto)}: subí pedidos por canal propio.")
    else:
        tips.append(f"Autogestión {_pct(auto)}: mantené el mix y no dependas de un solo canal.")
    if worst:
        tips.append("Meses más bajos: " + ", ".join(f"{row['mes']} ({_money(row['venta'])})" for row in worst) + ".")
    if best:
        tips.append(f"Mejor mes: {best['mes']} ({_money(best['venta'])}).")
    return {
        "mejor_mes": best,
        "peor_mes": worst[0] if worst else None,
        "peores_meses": worst,
        "consejos": tips[:5],
    }


def viewer_role(user: UserInfo | None) -> ChatRole:
    return "asesor" if user and user.role == "asesor" else "admin"


def asks_other_scope(message: str) -> bool:
    return bool(_OTHER_SCOPE.search(message or ""))


def scoped_snapshot(snapshot: dict[str, Any] | None, user: UserInfo | None) -> dict[str, Any] | None:
    if not snapshot:
        return None
    if viewer_role(user) != "asesor":
        out = dict(snapshot)
        out["alcance"] = "admin_filtro_actual" if snapshot.get("asesor_key") is not None else "admin_consolidado"
        return out
    key = snapshot.get("asesor_key")
    if key is not None and user and user.asesor_key is not None:
        try:
            if int(key) != int(user.asesor_key):
                return None
        except (TypeError, ValueError):
            return None
    out = dict(snapshot)
    if user:
        out["asesor_key"] = user.asesor_key
        out["asesor_nombre"] = user.nombre or snapshot.get("asesor_nombre")
    out["alcance"] = "solo_este_asesor"
    return out


def scope_refusal(user: UserInfo | None) -> str:
    who = (user.nombre if user and user.nombre else "tu tablero")
    return (
        f"Este chat solo ve el tablero de {who}. "
        "No puedo hablar de otros asesores, ranking, equipo ni consolidado. "
        "Si necesitás esa vista, tiene que entrar un administrador."
    )


def build_visuals(message: str, snapshot: dict[str, Any] | None, meses: list[dict[str, Any]] | None) -> list[ChatVisual]:
    if not snapshot:
        return []
    question = (message or "").lower()
    months = _month_rows(meses)
    meta = _num(snapshot.get("total_meta"))
    venta = _num(snapshot.get("venta_int"))
    cumpl = _num(snapshot.get("pct_cumpl_presupuesto"))
    actual = _num(snapshot.get("total_ventas"))
    aa = _num(snapshot.get("ventas_aa"))
    crec = _num(snapshot.get("pct_crecimiento_dinero"))
    auto = _num(snapshot.get("venta_autogestion"))
    auto_pct = _num(snapshot.get("pct_autogestion"))
    visuals: list[ChatVisual] = []

    pills = ChatVisual(
        type="pills",
        title="Tus KPIs",
        items=[
            ChatVisualItem(name="Cumplimiento", value=cumpl, kind="pct", tone="ok" if cumpl >= 1 else "bad"),
            ChatVisualItem(name="Crecimiento", value=crec, kind="pct", tone="ok" if crec >= 0 else "bad"),
            ChatVisualItem(name="Autogestión", value=auto_pct, kind="pct", tone="neutral"),
        ],
    )
    month_bars = ChatVisual(
        type="bars",
        title="Ventas por mes",
        highlight="low" if asks_worst_month(message) else "high",
        points=[
            {
                "name": str(row.get("mes_texto") or "")[:3],
                "value": _month_sale(row),
            }
            for row in months
        ],
    ) if months else None
    if asks_advice(message):
        visuals.append(pills)
        if month_bars:
            month_bars.highlight = "low"
            month_bars.title = "Meses más flojos"
            visuals.append(month_bars)
        else:
            visuals.append(
                ChatVisual(
                    type="lanes",
                    title="Meta, venta y brecha",
                    items=[
                        ChatVisualItem(name="Meta", value=meta, tone="neutral"),
                        ChatVisualItem(name="Venta int.", value=venta, tone="ok" if cumpl >= 1 else "bad"),
                        ChatVisualItem(name="Brecha", value=meta - venta, tone="ok" if meta - venta <= 0 else "bad"),
                    ],
                )
            )
        return visuals[:2]
    if asks_month_detail(message) and month_bars:
        if asks_worst_month(message):
            month_bars.title = "Peores meses"
        visuals.append(month_bars)
        return visuals[:2]

    if any(word in question for word in ("mejor", "prioridad", "cómo voy", "como voy", "resumen")) or not any(
        word in question for word in ("cumpl", "meta", "presup", "crec", "año ant", "autogest", "canal")
    ):
        visuals.append(pills)

    if any(word in question for word in ("cumpl", "meta", "presup", "brecha", "falta", "mejor")):
        visuals.append(
            ChatVisual(
                type="lanes",
                title="Meta, venta y brecha",
                items=[
                    ChatVisualItem(name="Meta", value=meta, tone="neutral"),
                    ChatVisualItem(name="Venta int.", value=venta, tone="ok" if cumpl >= 1 else "bad"),
                    ChatVisualItem(name="Brecha", value=meta - venta, tone="ok" if meta - venta <= 0 else "bad"),
                ],
            )
        )
    if any(word in question for word in ("crec", "año ant", "anterior")):
        if months:
            visuals.append(
                ChatVisual(
                    type="signed",
                    title="Crecimiento por mes",
                    points=[
                        {
                            "name": str(row.get("mes_texto") or "")[:3],
                            "value": _num(row.get("pct_crecimiento")),
                        }
                        for row in months
                    ],
                )
            )
        visuals.append(
            ChatVisual(
                type="lanes",
                title="Actual vs año anterior",
                items=[
                    ChatVisualItem(name="Ventas actuales", value=actual, tone="ok" if crec >= 0 else "bad"),
                    ChatVisualItem(name="Año anterior", value=aa, tone="neutral"),
                    ChatVisualItem(name="Diferencia", value=actual - aa, tone="ok" if actual - aa >= 0 else "bad"),
                ],
            )
        )
    if any(word in question for word in ("autogest", "canal", "mix")):
        visuals.append(
            ChatVisual(
                type="lanes",
                title="Autogestión vs resto",
                items=[
                    ChatVisualItem(name="Autogestión", value=auto, tone="ok"),
                    ChatVisualItem(name="Resto", value=max(0.0, venta - auto), tone="neutral"),
                    ChatVisualItem(name="Venta int.", value=venta, tone="neutral"),
                ],
            )
        )
    if not visuals:
        visuals.append(pills)
        visuals.append(
            ChatVisual(
                type="lanes",
                title="Meta, venta y brecha",
                items=[
                    ChatVisualItem(name="Meta", value=meta, tone="neutral"),
                    ChatVisualItem(name="Venta int.", value=venta, tone="ok" if cumpl >= 1 else "bad"),
                    ChatVisualItem(name="Brecha", value=meta - venta, tone="ok" if meta - venta <= 0 else "bad"),
                ],
            )
        )
    return visuals[:2]


def build_suggestions(role: ChatRole, snapshot: dict[str, Any] | None) -> list[str]:
    if not snapshot:
        return ["¿Cómo cargo el tablero?"]
    if role == "asesor":
        return [
            "¿Qué consejos me das según mis KPIs?",
            "¿Cuál fue mi peor mes?",
            "¿Cuáles son mis peores meses?",
            "¿En qué mes vendí más?",
        ]
    if snapshot.get("asesor_key") is None:
        return [
            "¿Cómo va el consolidado?",
            "¿Dónde está la brecha a meta?",
            "¿Cómo va el crecimiento?",
        ]
    return [
        "¿En qué debe mejorar este asesor?",
        "¿Cuánto le falta a la meta?",
        "¿Cómo va el crecimiento?",
    ]


def local_kpi_reply(message: str, snapshot: dict[str, Any] | None, period_label: str | None) -> str:
    period = period_label or "periodo no indicado"
    if not snapshot:
        return (
            "No hay un snapshot de KPI en el contexto. "
            "Carga el tablero con un periodo y vuelve a preguntar."
        )

    question = message.lower()
    asesor = snapshot.get("asesor_nombre") or (
        f"asesor {snapshot.get('asesor_key')}" if snapshot.get("asesor_key") is not None else "visión consolidada"
    )
    fuente = snapshot.get("fuente") or "desconocida"
    cumpl = (
        f"Cumplimiento {_pct(snapshot.get('pct_cumpl_presupuesto'))} = "
        f"venta internacional {_money(snapshot.get('venta_int'))} ÷ meta {_money(snapshot.get('total_meta'))}."
    )
    crec = (
        f"Crecimiento {_pct(snapshot.get('pct_crecimiento_dinero'))} = "
        f"(ventas {_money(snapshot.get('total_ventas'))} ÷ ventas año anterior "
        f"{_money(snapshot.get('ventas_aa'))}) − 1."
    )
    auto = (
        f"Autogestión {_pct(snapshot.get('pct_autogestion'))} = "
        f"venta autogestión {_money(snapshot.get('venta_autogestion'))} ÷ "
        f"venta internacional {_money(snapshot.get('venta_int'))}."
    )

    if "cumpl" in question or "meta" in question or "presupuesto" in question:
        return f"Periodo {period} · {asesor}. {cumpl} Cifras del snapshot ({fuente}), no de un modelo en vivo."
    if "crec" in question or "año ant" in question:
        return f"Periodo {period} · {asesor}. {crec} Cifras del snapshot ({fuente}), no de un modelo en vivo."
    if "autogest" in question:
        return f"Periodo {period} · {asesor}. {auto} Cifras del snapshot ({fuente}), no de un modelo en vivo."
    if "fórmula" in question or "formula" in question or "cálculo" in question or "calculo" in question:
        return (
            f"Fórmulas del tablero ({period}): "
            "1) cumplimiento = venta internacional ÷ meta. "
            "2) crecimiento = (ventas actuales ÷ ventas del mismo periodo del año anterior) − 1. "
            "3) autogestión = venta autogestión ÷ venta internacional."
        )
    if snapshot.get("vacio"):
        return f"El snapshot de {period} ({asesor}) está vacío: no hay meta ni ventas en ese filtro."

    return (
        f"Ayuda local con el snapshot de {period} ({asesor}, {fuente}). "
        f"{cumpl} {crec} {auto} "
        "No hay un modelo de lenguaje en vivo en este momento."
    )


def _redact_secret(text: str) -> str:
    return re.sub(r"sk-[A-Za-z0-9_\-]+", "sk-…", text)


def _clean_env(name: str, default: str = "") -> str:
    raw = (os.getenv(name, default) or default).strip().strip('"').strip("'")
    if raw.lower().startswith("bearer "):
        raw = raw[7:].strip()
    return raw


def rescue_model() -> str:
    raw = _clean_env("RESCUEAI_MODEL", "rescue-main") or "rescue-main"
    if raw not in RESCUE_ALIASES:
        logger.warning("RESCUEAI_MODEL=%s no es un alias RescueAI; usando rescue-main", raw)
        return "rescue-main"
    return raw


def rescue_configured() -> bool:
    return bool(_clean_env("RESCUEAI_API_KEY"))


def _scope_prompt(role: ChatRole, snapshot: dict[str, Any] | None, has_months: bool) -> str:
    who = (snapshot or {}).get("asesor_nombre") or "el tablero actual"
    months_hint = (
        "El JSON trae 'meses' y 'insights' (mejor_mes, peor_mes, peores_meses, consejos). "
        "Usá eso para mejor/peor mes y para consejos concretos según sus KPIs. "
        if has_months
        else "No hay desglose mensual en este turno. Si preguntan por un mes, di que no llegó la tabla mensual; no digas que no tenés permiso. "
        "Si hay insights.consejos, usalos igual. "
    )
    if role == "asesor":
        return (
            f"El usuario es un asesor. Podés hablar de {who}, de sus KPIs y de sus meses. "
            f"{months_hint}"
            "Solo decí que no tenés permiso si preguntan por OTRO asesor, ranking, equipo o consolidado. "
            "Nunca uses 'no tengo permiso' para una pregunta sobre sus propias ventas. "
            "No inventes personas ni cifras que no estén en el JSON."
        )
    if (snapshot or {}).get("asesor_key") is None:
        return (
            "El usuario es administrador viendo consolidado. "
            f"{months_hint}"
            "Podés hablar de los totales y de los meses del snapshot. "
            "No inventes asesores con nombre ni ranking. "
            "Si preguntan por un asesor puntual, pedí que lo filtren en el tablero."
        )
    return (
        f"El usuario es administrador viendo el filtro de {who}. "
        f"{months_hint}"
        "Respondé con ese snapshot y sus meses. Si preguntan por otro asesor, "
        "pedí que cambien el filtro. No inventes ranking."
    )


def _rescue_reply(
    message: str,
    snapshot: dict[str, Any] | None,
    period_label: str | None,
    role: ChatRole,
    meses: list[dict[str, Any]] | None = None,
) -> tuple[str | None, str | None]:
    api_key = _clean_env("RESCUEAI_API_KEY")
    if not api_key:
        return None, "sin llave"
    base = _clean_env("RESCUEAI_BASE_URL", RESCUE_DEFAULT_BASE).rstrip("/") or RESCUE_DEFAULT_BASE
    model = rescue_model()
    months = _month_payload(meses)
    context = {
        "period_label": period_label,
        "alcance": role,
        "snapshot": snapshot,
        "meses": months,
        "insights": board_insights(snapshot, meses),
    }
    payload = {
        "model": model,
        "temperature": 0.3,
        "max_tokens": 800,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Sos el asistente interno del tablero de KPIs comerciales HAB. "
                    "Respondé en español de Colombia, breve y claro, con viñetas cortas. "
                    "Zona horaria America/Bogota. No inventes datos que no estén en el JSON. "
                    "No pidas ni repitas secretos, NIT ni datos de cliente que no vengan en el snapshot. "
                    "Fórmulas: cumplimiento = venta_int / total_meta; "
                    "crecimiento = total_ventas / ventas_aa - 1; "
                    "autogestión = venta_autogestion / venta_int. "
                    "Si preguntan por el peor mes o los peores meses, usá insights.peor_mes y insights.peores_meses. "
                    "Si piden consejos o en qué mejorar, usá insights.consejos: 3 o 4 acciones cortas, con cifras, sin relleno. "
                    f"{_scope_prompt(role, snapshot, bool(months))}"
                ),
            },
            {
                "role": "user",
                "content": f"Contexto:\n{json.dumps(context, ensure_ascii=False, default=str)}\n\nPregunta: {message}",
            },
        ],
    }
    request = urllib.request.Request(
        f"{base}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            body = json.loads(response.read().decode("utf-8"))
        text = str(body["choices"][0]["message"]["content"]).strip()
        return (text or None), None if text else "respuesta vacía"
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:400]
        logger.warning("RescueAI HTTP %s", exc.code)
        if exc.code == 401:
            return None, (
                "HTTP 401: la llave virtual no existe en LiteLLM "
                "(no está en la tabla de tokens). Pide a T.I. RESCUE una llave nueva de HA."
            )
        return None, f"HTTP {exc.code}: {_redact_secret(detail or exc.reason)}"
    except (urllib.error.URLError, TimeoutError, KeyError, IndexError, TypeError, ValueError) as exc:
        logger.warning("RescueAI chat no disponible: %s", exc)
        return None, str(exc)


def answer_chat(body: ChatRequest, user: UserInfo | None = None) -> ChatResponse:
    role = viewer_role(user)
    snapshot = scoped_snapshot(body.snapshot, user)
    if role == "asesor" and asks_other_scope(body.message):
        return ChatResponse(
            reply=scope_refusal(user),
            source="local",
            suggestions=build_suggestions(role, snapshot),
        )
    extras = {
        "visuals": build_visuals(body.message, snapshot, body.meses),
        "suggestions": build_suggestions(role, snapshot),
    }
    if rescue_configured():
        rescue_text, err = _rescue_reply(body.message, snapshot, body.period_label, role, body.meses)
        if rescue_text:
            return ChatResponse(reply=rescue_text, source="rescue", **extras)
        return ChatResponse(
            reply=f"RescueAI no contestó. Detalle: {err or 'sin respuesta'}.",
            source="local",
            **extras,
        )
    return ChatResponse(
        reply=local_kpi_reply(body.message, snapshot, body.period_label),
        source="local",
        **extras,
    )
