from app.domain.models import UserInfo
from app.use_cases.chat import (
    ChatRequest,
    answer_chat,
    asks_advice,
    asks_month_detail,
    asks_other_scope,
    asks_worst_month,
    board_insights,
    build_visuals,
    local_kpi_reply,
)


def _snap() -> dict:
    return {
        "total_meta": 100,
        "venta_int": 80,
        "pct_cumpl_presupuesto": 0.8,
        "total_ventas": 90,
        "ventas_aa": 60,
        "pct_crecimiento_dinero": 0.5,
        "venta_autogestion": 20,
        "pct_autogestion": 0.25,
        "fuente": "sql",
        "vacio": False,
        "asesor_nombre": "Ana",
    }


def test_local_reply_without_snapshot():
    text = local_kpi_reply("¿cómo voy?", None, "Q1 2026")
    assert "snapshot" in text.lower()


def test_local_reply_cumplimiento():
    text = local_kpi_reply("¿cómo va el cumplimiento?", _snap(), "Q2 2026")
    assert "80.0%" in text
    assert "Q2 2026" in text


def test_answer_chat_without_rescue_key(monkeypatch):
    monkeypatch.delenv("RESCUEAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    res = answer_chat(ChatRequest(message="fórmulas", period_label="Q1 2026", snapshot=_snap()))
    assert res.source == "local"
    assert "cumplimiento" in res.reply.lower()


def test_answer_chat_with_key_but_failed_call(monkeypatch):
    monkeypatch.setenv("RESCUEAI_API_KEY", "sk-test")
    monkeypatch.setattr("app.use_cases.chat._rescue_reply", lambda *a, **k: (None, "HTTP 401"))
    res = answer_chat(ChatRequest(message="cuántos asesores tengo", period_label="Q1 2026", snapshot=_snap()))
    assert res.source == "local"
    assert "HTTP 401" in res.reply


def test_asesor_cannot_ask_about_others(monkeypatch):
    monkeypatch.delenv("RESCUEAI_API_KEY", raising=False)
    user = UserInfo(username="fcastro", role="asesor", asesor_key=114, nombre="Fernando Castro")
    res = answer_chat(
        ChatRequest(message="¿cómo va el ranking de asesores?", period_label="Q1 2026", snapshot=_snap()),
        user,
    )
    assert res.source == "local"
    assert "ranking" in res.reply.lower() or "otros asesores" in res.reply.lower()
    assert asks_other_scope("cuántos asesores hay")


def test_own_month_question_is_allowed():
    assert not asks_other_scope("en qué mes de 2026 vendí más")
    assert asks_month_detail("en qué mes de 2026 vendí más")
    visuals = build_visuals(
        "en qué mes de 2026 vendí más",
        _snap(),
        [
            {"mes_texto": "Enero", "venta_actual": 10, "venta_int": 10, "es_total": False},
            {"mes_texto": "Marzo", "venta_actual": 40, "venta_int": 40, "es_total": False},
        ],
    )
    assert visuals
    assert visuals[0].type == "bars"
    assert visuals[0].points[1]["value"] == 40


def test_worst_months_and_advice():
    months = [
        {"mes_texto": "Enero", "venta_actual": 10, "venta_int": 10, "es_total": False},
        {"mes_texto": "Febrero", "venta_actual": 12, "venta_int": 12, "es_total": False},
        {"mes_texto": "Marzo", "venta_actual": 40, "venta_int": 40, "es_total": False},
    ]
    assert asks_worst_month("cuál fue mi peor mes")
    assert asks_advice("qué consejos me das según mis kpis")
    worst = build_visuals("cuáles son mis peores meses", _snap(), months)
    assert worst[0].type == "bars"
    assert worst[0].highlight == "low"
    advice = build_visuals("qué consejos me das según mis kpis", _snap(), months)
    assert advice[0].type == "pills"
    assert advice[1].highlight == "low"
    info = board_insights(_snap(), months)
    assert info["peor_mes"]["mes"] == "Enero"
    assert info["mejor_mes"]["mes"] == "Marzo"
    assert len(info["peores_meses"]) == 3
    assert info["consejos"]


def test_chat_attaches_visuals(monkeypatch):
    monkeypatch.delenv("RESCUEAI_API_KEY", raising=False)
    res = answer_chat(ChatRequest(message="¿en qué debo mejorar?", period_label="Q1 2026", snapshot=_snap()))
    assert res.visuals
    assert res.suggestions


def test_rescue_model_rejects_real_weights(monkeypatch):
    from app.use_cases.chat import rescue_model

    monkeypatch.setenv("RESCUEAI_MODEL", "qwen2.5-32b")
    assert rescue_model() == "rescue-main"
    monkeypatch.setenv("RESCUEAI_MODEL", "rescue-fast")
    assert rescue_model() == "rescue-fast"