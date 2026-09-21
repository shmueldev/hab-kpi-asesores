import os

from app.domain.models import AppUser, ChangePasswordRequest, RecoverPasswordRequest
from app.domain.ports.user_repository_port import UserRepositoryPort
from app.infrastructure.security import hash_password, verify_password

GENERIC_PASSWORD = os.getenv("GENERIC_TEMP_PASSWORD", "HabKpi.2026")
MIN_LEN = 8


def validate_new_password(plain: str) -> None:
    if len(plain) < MIN_LEN:
        raise ValueError(f"La nueva contraseña debe tener al menos {MIN_LEN} caracteres")
    if plain == GENERIC_PASSWORD:
        raise ValueError("Elige una contraseña distinta a la temporal genérica")


class ChangePasswordUseCase:
    def __init__(self, users: UserRepositoryPort) -> None:
        self._users = users

    def execute(self, username: str, request: ChangePasswordRequest) -> None:
        user = self._users.get_by_username(username)
        if not user or not verify_password(request.current_password, user.password_hash):
            raise ValueError("La contraseña actual no es correcta")
        if request.current_password == request.new_password:
            raise ValueError("La nueva contraseña debe ser distinta a la actual")
        validate_new_password(request.new_password)
        updated = user.model_copy(
            update={
                "password_hash": hash_password(request.new_password),
                "must_change_password": False,
            }
        )
        self._users.save(updated)


class RecoverPasswordUseCase:
    def __init__(self, users: UserRepositoryPort) -> None:
        self._users = users

    def execute(self, request: RecoverPasswordRequest) -> AppUser:
        user = self._users.get_by_username(request.username)
        if user is None or user.role != "asesor" or user.asesor_key != request.asesor_key:
            raise ValueError("Usuario o identificador de asesor no coinciden")
        validate_new_password(request.new_password)
        updated = user.model_copy(
            update={
                "password_hash": hash_password(request.new_password),
                "must_change_password": False,
            }
        )
        self._users.save(updated)
        return updated
