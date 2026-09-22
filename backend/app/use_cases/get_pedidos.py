from datetime import date

from app.domain.errors import PedidoUnavailable
from app.domain.models import PedidoFilter, PedidoResumen
from app.domain.ports.advisor_repository_port import AdvisorRepositoryPort
from app.domain.ports.pedido_port import PedidoPort


class GetPedidos:
    def __init__(self, repository: PedidoPort, advisors: AdvisorRepositoryPort | None = None) -> None:
        self._repository = repository
        self._advisors = advisors

    def execute(
        self,
        fecha_ini: date,
        fecha_fin: date,
        asesor_key: int | None = None,
        nit: str | None = None,
    ) -> PedidoResumen:
        filters = PedidoFilter(
            fecha_ini=fecha_ini,
            fecha_fin=fecha_fin,
            asesor_key=asesor_key,
            nit=nit or None,
        )
        try:
            data = self._repository.get_resumen(filters)
        except Exception as exc:  # noqa: BLE001
            raise PedidoUnavailable(str(exc)) from exc
        data.asesor_key = asesor_key
        if asesor_key is not None and self._advisors is not None:
            data.asesor_nombre = self._advisors.get_nombre(asesor_key)
        return data
