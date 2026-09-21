from abc import ABC, abstractmethod

from app.domain.models import Asesor


class AdvisorRepositoryPort(ABC):
    @abstractmethod
    def list_asesores(self) -> list[Asesor]:
        raise NotImplementedError

    @abstractmethod
    def get_nombre(self, asesor_key: int) -> str | None:
        raise NotImplementedError
