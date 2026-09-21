from datetime import date

from app.domain.monthly import compose_monthly, iter_months
from app.infrastructure.adapters.memory_kpi_repository import MemoryKpiRepository
from app.domain.models import KpiFilter


def test_iter_months_spans_quarter():
    months = iter_months(date(2026, 7, 1), date(2026, 9, 21))
    assert months == [(2026, 7), (2026, 8), (2026, 9)]


def test_compose_monthly_explains_totals():
    out = compose_monthly(
        date(2026, 1, 1),
        date(2026, 2, 28),
        meta={(2026, 1): 100, (2026, 2): 100},
        ventas={(2026, 1): (80, 90), (2026, 2): (120, 110)},
        auto={(2026, 1): 20, (2026, 2): 30},
        ventas_aa_por_mes={1: 100, 2: 100},
        today=date(2026, 9, 21),
    )
    assert len(out.filas) == 2
    assert out.filas[0].mes_texto == "enero"
    assert out.filas[0].pct_cumplimiento == 0.9
    assert out.total is not None
    assert out.total.venta_int == 200
    assert out.total.pct_crecimiento == 0.0
    assert out.filas[1].acumulado_vs_aa == 0


def test_memory_repo_monthly_has_rows():
    repo = MemoryKpiRepository()
    rows = repo.get_monthly_breakdown(
        KpiFilter(
            fecha_ini=date(2026, 1, 1),
            fecha_fin=date(2026, 3, 31),
            fecha_ini_aa=date(2025, 1, 1),
            fecha_fin_aa=date(2025, 3, 31),
        )
    )
    assert len(rows.filas) == 3
    assert rows.total is not None
    assert rows.total.es_total
