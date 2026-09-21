from abc import ABC, abstractmethod

from app.domain.models import CarteraAbierta, CarteraAging, CarteraCanceladas, CarteraFilter, CarteraSiesaSaldo


class CarteraPort(ABC):
    @abstractmethod
    def get_abierta(self, filters: CarteraFilter) -> CarteraAbierta:
        raise NotImplementedError

    @abstractmethod
    def get_aging(self, filters: CarteraFilter) -> CarteraAging:
        raise NotImplementedError

    @abstractmethod
    def get_canceladas(self, filters: CarteraFilter) -> CarteraCanceladas:
        raise NotImplementedError

    @abstractmethod
    def get_siesa_saldo(self, filters: CarteraFilter) -> CarteraSiesaSaldo:
        raise NotImplementedError
