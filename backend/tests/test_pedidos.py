from datetime import date

from app.domain.models import PedidoFilter
from app.infrastructure.adapters.memory_pedido_repository import MemoryPedidoRepository
from app.use_cases.get_pedidos import GetPedidos


def test_memory_pedidos_scale_with_range():
    repo = MemoryPedidoRepository()
    q = repo.get_resumen(PedidoFilter(fecha_ini=date(2026, 7, 1), fecha_fin=date(2026, 9, 21)))
    year = repo.get_resumen(PedidoFilter(fecha_ini=date(2026, 1, 1), fecha_fin=date(2026, 9, 21)))
    assert q.n > 0
    assert year.n > q.n
    assert sum(c.n for c in q.por_canal) == q.n
    assert q.fuente == "demo"


def test_memory_pedidos_asesor_is_smaller():
    repo = MemoryPedidoRepository()
    all_rows = repo.get_resumen(PedidoFilter(fecha_ini=date(2026, 7, 1), fecha_fin=date(2026, 9, 21)))
    one = repo.get_resumen(
        PedidoFilter(fecha_ini=date(2026, 7, 1), fecha_fin=date(2026, 9, 21), asesor_key=1)
    )
    assert one.n < all_rows.n
    assert one.asesor_key == 1


def test_get_pedidos_stamps_nombre():
    class FakeAdvisors:
        def get_nombre(self, asesor_key: int) -> str | None:
            return "Fernando Castro" if asesor_key == 1 else None

    use_case = GetPedidos(MemoryPedidoRepository(), FakeAdvisors())
    data = use_case.execute(date(2026, 7, 1), date(2026, 9, 21), asesor_key=1)
    assert data.asesor_nombre == "Fernando Castro"
