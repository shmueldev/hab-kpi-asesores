from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from app.domain.models import UserInfo
from app.domain.uso import UsoDayReport, UsoPing, parse_screen
from app.infrastructure.api.dependencies import get_current_user, get_uso_use_case
from app.use_cases.track_uso import TrackUso

router = APIRouter(prefix="/uso", tags=["uso"])


@router.post("")
def ping_uso(
    body: UsoPing,
    user: UserInfo = Depends(get_current_user),
    use_case: TrackUso = Depends(get_uso_use_case),
) -> dict:
    screen = parse_screen(body.screen)
    if screen is None:
        raise HTTPException(status_code=400, detail="Pantalla no válida")
    use_case.ping(user, screen)
    return {"ok": True}


@router.get("", response_model=UsoDayReport)
def get_uso(
    fecha: date | None = Query(None),
    user: UserInfo = Depends(get_current_user),
    use_case: TrackUso = Depends(get_uso_use_case),
) -> UsoDayReport:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Solo el administrador ve el uso")
    return use_case.report(fecha)
