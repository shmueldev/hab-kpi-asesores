from app.use_cases.chat import ChatRequest, answer_chat, local_kpi_reply


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


def test_answer_chat_without_openai_key(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    res = answer_chat(ChatRequest(message="fórmulas", period_label="Q1 2026", snapshot=_snap()))
    assert res.source == "local"
    assert "cumplimiento" in res.reply.lower()