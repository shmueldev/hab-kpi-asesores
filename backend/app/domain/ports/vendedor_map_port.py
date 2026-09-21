from abc import ABC, abstractmethod

from app.domain.vendedor import VendedorMatch


class VendedorMapPort(ABC):
    @abstractmethod
    def resolve(self, asesor_key: int) -> VendedorMatch | None:
        raise NotImplementedError
