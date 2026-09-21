from datetime import date

from app.domain.errors import KpiDataUnavailable
from app.domain.models import KpiDashboard, KpiFilter
from app.domain.ports.kpi_repository_port import KpiRepositoryPort
from app.infrastructure.adapters.cached_kpi_repository import CachedKpiRepository
from app.infrastructure.adapters.memory_kpi_cache import MemoryKpiCache
from app.infrastructure.adapters.memory_kpi_repository import MemoryKpiRepository


class FailingRepo(KpiRepositoryPort):
    def get_kpi_data(self, filters: KpiFilter) -> KpiDashboard:
        raise RuntimeError("sql down")


def _filters() -> KpiFilter:
    return KpiFilter(
        fecha_ini=date(2026, 1, 1),
        fecha_fin=date(2026, 1, 31),
        fecha_ini_aa=date(2025, 1, 1),
        fecha_fin_aa=date(2025, 1, 31),
        asesor_key=146,
    )


def test_sql_success_saves_and_returns_sql_source():
    cache = MemoryKpiCache()
    repo = CachedKpiRepository(MemoryKpiRepository(), cache)
    dash = repo.get_kpi_data(_filters())
    assert dash.fuente == "sql"
    cached = cache.get_kpis(_filters())
    assert cached is not None
    assert cached.fuente == "redis"


def test_sql_fail_returns_last_redis():
    cache = MemoryKpiCache()
    CachedKpiRepository(MemoryKpiRepository(), cache).get_kpi_data(_filters())
    fallback = CachedKpiRepository(FailingRepo(), cache)
    dash = fallback.get_kpi_data(_filters())
    assert dash.fuente == "redis"
    assert dash.periodo_guardado_ini == date(2026, 1, 1)


def test_file_cache_survives_sql_outage(tmp_path):
    from app.infrastructure.adapters.file_kpi_cache import FileKpiCache

    cache = FileKpiCache(tmp_path)
    CachedKpiRepository(MemoryKpiRepository(), cache).get_kpi_data(_filters())
    dash = CachedKpiRepository(FailingRepo(), cache).get_kpi_data(_filters())
    assert dash.fuente == "redis"
    assert dash.periodo_guardado_ini == date(2026, 1, 1)


def test_sql_fail_without_redis_raises():
    repo = CachedKpiRepository(FailingRepo(), MemoryKpiCache())
    try:
        repo.get_kpi_data(_filters())
    except KpiDataUnavailable:
        return
    raise AssertionError("debía fallar sin snapshot")


class CountingRepo(KpiRepositoryPort):
    def __init__(self) -> None:
        self.calls = 0
        self._inner = MemoryKpiRepository()

    def get_kpi_data(self, filters: KpiFilter) -> KpiDashboard:
        self.calls += 1
        return self._inner.get_kpi_data(filters)


def test_read_through_skips_sql_on_exact_hit():
    cache = MemoryKpiCache()
    source = CountingRepo()
    repo = CachedKpiRepository(source, cache)
    first = repo.get_kpi_data(_filters())
    second = repo.get_kpi_data(_filters())
    assert source.calls == 1
    assert first.fuente == "sql"
    assert second.fuente == "redis"


def test_read_through_does_not_reuse_other_period():
    cache = MemoryKpiCache()
    source = CountingRepo()
    repo = CachedKpiRepository(source, cache)
    repo.get_kpi_data(_filters())
    other = KpiFilter(
        fecha_ini=date(2026, 4, 1),
        fecha_fin=date(2026, 6, 30),
        fecha_ini_aa=date(2025, 4, 1),
        fecha_fin_aa=date(2025, 6, 30),
        asesor_key=146,
    )
    repo.get_kpi_data(other)
    assert source.calls == 2


def test_memory_and_file_serve_exact_if_redis_dead(tmp_path):
    from app.infrastructure.adapters.composite_kpi_cache import CompositeKpiCache
    from app.infrastructure.adapters.file_kpi_cache import FileKpiCache

    class DeadRedis(MemoryKpiCache):
        def get_exact_kpis(self, filters: KpiFilter) -> KpiDashboard | None:
            raise RuntimeError("redis down")

        def get_kpis(self, filters: KpiFilter) -> KpiDashboard | None:
            raise RuntimeError("redis down")

        def save_kpis(self, filters: KpiFilter, dashboard: KpiDashboard) -> None:
            raise RuntimeError("redis down")

        def ping(self) -> bool:
            return False

    disk = FileKpiCache(tmp_path)
    live = CompositeKpiCache(MemoryKpiCache(), disk, DeadRedis())
    CachedKpiRepository(MemoryKpiRepository(), live).get_kpi_data(_filters())
    cold = CompositeKpiCache(MemoryKpiCache(), disk, DeadRedis())
    dash = CachedKpiRepository(FailingRepo(), cold).get_kpi_data(_filters())
    assert dash.fuente == "redis"
    assert dash.periodo_guardado_ini == date(2026, 1, 1)
