from abc import ABC, abstractmethod

from app.domain.models import PedidoFilter, PedidoResumen


class PedidoPort(ABC):
    @abstractmethod
    def get_resumen(self, filters: PedidoFilter) -> PedidoResumen:
        raise NotImplementedError
