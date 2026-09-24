from datetime import date

from app.domain.cartera import cubeta_label, days_overdue, days_to_due
from app.domain.models import CarteraFilter
from app.infrastructure.adapters.memory_cartera_repository import MemoryCarteraRepository


def test_cubetas_signo_as_of_minus_vcto():
    as_of = date(2026, 9, 21)
    assert cubeta_label(days_overdue(date(2026, 9, 30), as_of)) == "1. Al día"
    assert cubeta_label(days_overdue(date(2026, 9, 21), as_of)) == "1. Al día"
    assert cubeta_label(days_overdue(date(2026, 9, 1), as_of)) == "2. Gracia 30 días"
    assert cubeta_label(days_overdue(date(2026, 8, 1), as_of)) == "3. Vencida"
    assert cubeta_label(days_overdue(None, as_of)) is None


def test_dias_a_vcto_signo_invertido():
    as_of = date(2026, 9, 21)
    assert days_to_due(date(2026, 9, 30), as_of) == 9
    assert days_overdue(date(2026, 9, 30), as_of) == -9


def test_memory_abierta_identity_without_missing_vcto():
    repo = MemoryCarteraRepository()
    data = repo.get_abierta(CarteraFilter(as_of=date(2026, 9, 21), anio=2026))
    assert data.abierta == data.al_dia.monto + data.gracia.monto + data.vencida.monto + data.sin_vcto.monto


def test_sql_abierta_filters_year_on_fecha_docto():
    from app.infrastructure.adapters.sql_cartera_repository import ABIERTA_SQL, AGING_SQL

    assert "YEAR(CAST(f.fecha_docto AS date))" in ABIERTA_SQL
    assert "YEAR(CAST(f.fecha_docto AS date))" in AGING_SQL


def test_memory_canceladas_has_quarters():
    repo = MemoryCarteraRepository()
    data = repo.get_canceladas(CarteraFilter(as_of=date(2026, 9, 21), anio=2026))
    assert data.total == (data.q1 or 0) + (data.q2 or 0) + (data.q3 or 0) + (data.q4 or 0)
    q3 = repo.get_canceladas(CarteraFilter(as_of=date(2026, 9, 21), anio=2026, trimestre=3))
    assert q3.q3 == 15
    assert q3.q1 is None
