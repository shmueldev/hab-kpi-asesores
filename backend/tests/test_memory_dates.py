from datetime import date

from app.infrastructure.adapters.memory_kpi_repository import MemoryKpiRepository
from app.use_cases.get_kpi_dashboard import GetKpiDashboard


def test_memory_repo_scales_with_date_range():
    repo = MemoryKpiRepository()
    uc = GetKpiDashboard(repo, repo)
    month = uc.execute(date(2026, 1, 1), date(2026, 1, 31))
    year = uc.execute(date(2026, 1, 1), date(2026, 12, 31))
    assert year.total_ventas > month.total_ventas
    assert month.fuente == "demo"
    assert year.fuente == "demo"


def test_memory_repo_asesor_is_smaller():
    repo = MemoryKpiRepository()
    uc = GetKpiDashboard(repo, repo)
    global_ = uc.execute(date(2026, 1, 1), date(2026, 1, 31))
    one = uc.execute(date(2026, 1, 1), date(2026, 1, 31), asesor_key=146)
    assert one.total_ventas < global_.total_ventas
    assert one.asesor_nombre == "Asesor demo"
