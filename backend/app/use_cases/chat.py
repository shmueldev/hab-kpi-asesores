from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.request
from typing import Any, Literal

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

ChatSource = Literal["local", "openai"]


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    period_label: str | None = None
    snapshot: dict[str, Any] | None = None


class ChatResponse(BaseModel):
    reply: str
    source: ChatSource


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


def _openai_reply(message: str, snapshot: dict[str, Any] | None, period_label: str | None) -> str | None:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip() or "gpt-4o-mini"
    context = {
        "period_label": period_label,
        "snapshot": snapshot,
    }
    payload = {
        "model": model,
        "temperature": 0.2,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Eres un asistente interno de un tablero de KPIs comerciales HAB. "
                    "Responde en español, breve y con las cifras del snapshot. "
                    "No inventes datos que no estén en el JSON. "
                    "Fórmulas: cumplimiento = venta_int / total_meta; "
                    "crecimiento = total_ventas / ventas_aa - 1; "
                    "autogestión = venta_autogestion / venta_int."
                ),
            },
            {
                "role": "user",
                "content": f"Contexto:\n{json.dumps(context, ensure_ascii=False, default=str)}\n\nPregunta: {message}",
            },
        ],
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            body = json.loads(response.read().decode("utf-8"))
        return str(body["choices"][0]["message"]["content"]).strip()
    except (urllib.error.URLError, TimeoutError, KeyError, IndexError, TypeError, ValueError) as exc:
        logger.warning("OpenAI chat no disponible: %s", exc)
        return None


def answer_chat(body: ChatRequest) -> ChatResponse:
    openai_text = _openai_reply(body.message, body.snapshot, body.period_label)
    if openai_text:
        return ChatResponse(reply=openai_text, source="openai")
    return ChatResponse(
        reply=local_kpi_reply(body.message, body.snapshot, body.period_label),
        source="local",
    )
