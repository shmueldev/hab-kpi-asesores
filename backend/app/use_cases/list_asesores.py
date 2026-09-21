from app.domain.models import Asesor
from app.domain.ports.advisor_repository_port import AdvisorRepositoryPort


class ListAsesores:
    def __init__(self, repository: AdvisorRepositoryPort) -> None:
        self._repository = repository

    def execute(self, asesor_key: int | None = None) -> list[Asesor]:
        items = self._repository.list_asesores()
        if asesor_key is None:
            return items
        return [a for a in items if a.asesor_key == asesor_key]
