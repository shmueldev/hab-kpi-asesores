from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from app.domain.errors import PedidoUnavailable
from app.domain.models import PedidoResumen
from app.infrastructure.api.dependencies import get_effective_asesor_key, get_pedidos_use_case
from app.use_cases.get_pedidos import GetPedidos

router = APIRouter(prefix="/pedidos", tags=["pedidos"])


@router.get("", response_model=PedidoResumen)
def get_pedidos(
    fecha_ini: date = Query(...),
    fecha_fin: date = Query(...),
    nit: str | None = Query(None),
    asesor_key: int | None = Depends(get_effective_asesor_key),
    use_case: GetPedidos = Depends(get_pedidos_use_case),
) -> PedidoResumen:
    try:
        return use_case.execute(
            fecha_ini=fecha_ini,
            fecha_fin=fecha_fin,
            asesor_key=asesor_key,
            nit=nit,
        )
    except PedidoUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
