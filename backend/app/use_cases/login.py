import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.domain.models import LoginRequest, TokenResponse, UserInfo
from app.domain.ports.user_repository_port import UserRepositoryPort
from app.infrastructure.security import verify_password

ALGORITHM = "HS256"


def _secret() -> str:
    return os.getenv("JWT_SECRET", "kpi-platform-demo-secret-change-in-prod")


def _expire_minutes() -> int:
    return int(os.getenv("JWT_EXPIRE_MINUTES", "480"))


class LoginUseCase:
    def __init__(self, users: UserRepositoryPort) -> None:
        self._users = users

    def execute(self, request: LoginRequest) -> TokenResponse:
        user = self._users.get_by_username(request.username)
        if not user or not verify_password(request.password, user.password_hash):
            raise ValueError("Credenciales inválidas")

        expire = datetime.now(timezone.utc) + timedelta(minutes=_expire_minutes())
        payload = {
            "sub": user.username,
            "role": user.role,
            "asesor_key": user.asesor_key,
            "nombre": user.nombre,
            "must_change_password": user.must_change_password,
            "exp": expire,
        }
        token = jwt.encode(payload, _secret(), algorithm=ALGORITHM)
        return TokenResponse(
            access_token=token,
            role=user.role,
            asesor_key=user.asesor_key,
            username=user.username,
            nombre=user.nombre,
            must_change_password=user.must_change_password,
        )


def decode_token(token: str) -> UserInfo:
    try:
        payload = jwt.decode(token, _secret(), algorithms=[ALGORITHM])
        username = payload.get("sub")
        role = payload.get("role")
        if not username or not role:
            raise ValueError("Token inválido")
        return UserInfo(
            username=username,
            role=role,
            asesor_key=payload.get("asesor_key"),
            nombre=payload.get("nombre"),
            must_change_password=bool(payload.get("must_change_password")),
        )
    except JWTError as exc:
        raise ValueError("Token inválido o expirado") from exc
