from datetime import date

from app.domain.errors import CarteraUnavailable
from app.domain.models import CarteraAbierta, CarteraAging, CarteraCanceladas, CarteraFilter, CarteraSiesaSaldo
from app.domain.ports.cartera_port import CarteraPort


class GetCartera:
    def __init__(self, repository: CarteraPort) -> None:
        self._repository = repository

    def _filters(
        self,
        as_of: date | None,
        nit: str | None = None,
        vendedor_rowid: int | None = None,
        sucursal_cliente_key: int | None = None,
        id_sucursal: str | None = None,
        codigo_vendedor: str | None = None,
        anio: int | None = None,
        trimestre: int | None = None,
    ) -> CarteraFilter:
        return CarteraFilter(
            as_of=as_of or date.today(),
            nit=nit or None,
            vendedor_rowid=vendedor_rowid,
            sucursal_cliente_key=sucursal_cliente_key,
            id_sucursal=id_sucursal or None,
            codigo_vendedor=codigo_vendedor or None,
            anio=anio,
            trimestre=trimestre,
        )

    def abierta(self, **kwargs) -> CarteraAbierta:
        try:
            return self._repository.get_abierta(self._filters(**kwargs))
        except Exception as exc:  # noqa: BLE001
            raise CarteraUnavailable(str(exc)) from exc

    def aging(self, **kwargs) -> CarteraAging:
        try:
            return self._repository.get_aging(self._filters(**kwargs))
        except Exception as exc:  # noqa: BLE001
            raise CarteraUnavailable(str(exc)) from exc

    def canceladas(self, **kwargs) -> CarteraCanceladas:
        try:
            return self._repository.get_canceladas(self._filters(**kwargs))
        except Exception as exc:  # noqa: BLE001
            raise CarteraUnavailable(str(exc)) from exc

    def siesa(self, **kwargs) -> CarteraSiesaSaldo:
        try:
            return self._repository.get_siesa_saldo(self._filters(**kwargs))
        except Exception as exc:  # noqa: BLE001
            raise CarteraUnavailable(str(exc)) from exc
