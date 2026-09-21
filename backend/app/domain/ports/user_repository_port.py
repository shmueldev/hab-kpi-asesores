from abc import ABC, abstractmethod

from app.domain.models import AppUser


class UserRepositoryPort(ABC):
    @abstractmethod
    def get_by_username(self, username: str) -> AppUser | None:
        raise NotImplementedError

    @abstractmethod
    def save(self, user: AppUser) -> None:
        raise NotImplementedError
