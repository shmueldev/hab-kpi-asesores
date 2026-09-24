from fastapi import APIRouter, Depends, HTTPException

from app.domain.models import (
    ChangePasswordRequest,
    LoginRequest,
    RecoverPasswordRequest,
    TokenResponse,
    UserInfo,
)
from app.infrastructure.api.dependencies import (
    get_change_password_use_case,
    get_current_user,
    get_login_use_case,
    get_recover_password_use_case,
    get_uso_use_case,
)
from app.use_cases.login import LoginUseCase
from app.use_cases.passwords import ChangePasswordUseCase, RecoverPasswordUseCase
from app.use_cases.track_uso import TrackUso

auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    use_case: LoginUseCase = Depends(get_login_use_case),
    uso: TrackUso = Depends(get_uso_use_case),
) -> TokenResponse:
    try:
        token = use_case.execute(body)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    try:
        uso.ping(
            UserInfo(
                username=token.username,
                role=token.role,
                asesor_key=token.asesor_key,
                nombre=token.nombre,
            ),
            "login",
        )
    except Exception:
        pass
    return token


@auth_router.get("/me", response_model=UserInfo)
def me(user: UserInfo = Depends(get_current_user)) -> UserInfo:
    return user


@auth_router.post("/change-password")
def change_password(
    body: ChangePasswordRequest,
    user: UserInfo = Depends(get_current_user),
    use_case: ChangePasswordUseCase = Depends(get_change_password_use_case),
) -> dict:
    try:
        use_case.execute(user.username, body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True, "must_change_password": False}


@auth_router.post("/recover")
def recover_password(
    body: RecoverPasswordRequest,
    use_case: RecoverPasswordUseCase = Depends(get_recover_password_use_case),
) -> dict:
    try:
        use_case.execute(body)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True}
