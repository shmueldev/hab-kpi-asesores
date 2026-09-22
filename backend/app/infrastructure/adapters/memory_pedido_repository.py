from app.domain.models import PedidoCanal, PedidoCliente, PedidoFilter, PedidoResumen, PedidoRow
from app.domain.ports.pedido_port import PedidoPort


class MemoryPedidoRepository(PedidoPort):
    def get_resumen(self, filters: PedidoFilter) -> PedidoResumen:
        days = max(1, (filters.fecha_fin - filters.fecha_ini).days + 1)
        scale = days / 90.0
        if filters.asesor_key is not None:
            scale *= 0.18
        n = max(1, int(420 * scale))
        valor = round(185_000_000.0 * scale, 2)
        auto_n = int(n * 0.41)
        b2b_n = n - auto_n
        auto_valor = round(valor * 0.38, 2)
        b2b_valor = round(valor - auto_valor, 2)
        nit = (filters.nit or "").strip() or None
        detalle = [
            PedidoRow(
                fecha_pedido=filters.fecha_fin,
                numero=1001,
                nit=nit or "900111222",
                cliente="Cliente demo A",
                canal="AUTOGESTION",
                valor=auto_valor / max(auto_n, 1),
            ),
            PedidoRow(
                fecha_pedido=filters.fecha_ini,
                numero=1002,
                nit="800333444",
                cliente="Cliente demo B",
                canal="B2B",
                valor=b2b_valor / max(b2b_n, 1),
                fecha_despacho=filters.fecha_fin,
            ),
        ]
        if nit:
            detalle = [row for row in detalle if row.nit == nit]
        return PedidoResumen(
            fecha_ini=filters.fecha_ini,
            fecha_fin=filters.fecha_fin,
            n=n if not nit else len(detalle),
            valor=valor if not nit else sum(row.valor for row in detalle),
            n_anulados=0,
            n_espera=0,
            n_despachados=n if not nit else sum(1 for row in detalle if row.fecha_despacho),
            por_canal=[
                PedidoCanal(canal="AUTOGESTION", es_autogestion=True, n=auto_n, valor=auto_valor),
                PedidoCanal(canal="B2B", es_autogestion=False, n=b2b_n, valor=b2b_valor),
            ],
            top_clientes=[
                PedidoCliente(nit="900111222", nombre="Cliente demo A", n=auto_n, valor=auto_valor),
                PedidoCliente(nit="800333444", nombre="Cliente demo B", n=b2b_n, valor=b2b_valor),
            ],
            detalle=detalle,
            fuente="demo",
            asesor_key=filters.asesor_key,
        )
