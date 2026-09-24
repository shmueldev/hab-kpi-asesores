from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from app.domain.errors import CarteraUnavailable
from app.domain.models import CarteraAbierta, CarteraAging, CarteraCanceladas, CarteraSiesaSaldo
from app.domain.vendedor import NO_VENDEDOR_ROWID
from app.infrastructure.api.dependencies import get_cartera_use_case, get_current_user, get_effective_cartera_keys
from app.use_cases.get_cartera import GetCartera

router = APIRouter(prefix="/cartera", tags=["cartera"])


def _common(
    as_of: date | None = Query(None, description="Foto de cartera. Default hoy. No es un trimestre."),
    nit: str | None = Query(None),
    sucursal_cliente_key: int | None = Query(None),
    id_sucursal: str | None = Query(None),
    scope: dict = Depends(get_effective_cartera_keys),
) -> dict:
    return {
        "as_of": as_of,
        "nit": nit,
        "vendedor_rowid": scope.get("vendedor_rowid"),
        "sucursal_cliente_key": sucursal_cliente_key,
        "id_sucursal": id_sucursal,
        "codigo_vendedor": scope.get("codigo_vendedor"),
        "asesor_key": scope.get("asesor_key"),
        "vendedor_nombre": scope.get("vendedor_nombre"),
    }


def _stamp_abierta(data: CarteraAbierta, params: dict, anio: int | None = None) -> CarteraAbierta:
    rowid = params.get("vendedor_rowid")
    data.asesor_key = params.get("asesor_key")
    data.vendedor_rowid = None if rowid == NO_VENDEDOR_ROWID else rowid
    data.vendedor_nombre = params.get("vendedor_nombre")
    data.anio = anio
    return data


@router.get("/unoee/abierta", response_model=CarteraAbierta)
def get_abierta(
    params: dict = Depends(_common),
    anio: int | None = Query(None, description="Año civil de fecha_docto. Sin año = todas las abiertas."),
    _: object = Depends(get_current_user),
    use_case: GetCartera = Depends(get_cartera_use_case),
) -> CarteraAbierta:
    try:
        kwargs = _repo_kwargs(params)
        kwargs["anio"] = anio
        return _stamp_abierta(use_case.abierta(**kwargs), params, anio)
    except CarteraUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/unoee/aging", response_model=CarteraAging)
def get_aging(
    params: dict = Depends(_common),
    anio: int | None = Query(None, description="Año civil de fecha_docto. Sin año = todas las abiertas."),
    _: object = Depends(get_current_user),
    use_case: GetCartera = Depends(get_cartera_use_case),
) -> CarteraAging:
    try:
        kwargs = _repo_kwargs(params)
        kwargs["anio"] = anio
        data = use_case.aging(**kwargs)
        data.resumen = _stamp_abierta(data.resumen, params, anio)
        return data
    except CarteraUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/unoee/canceladas", response_model=CarteraCanceladas)
def get_canceladas(
    params: dict = Depends(_common),
    anio: int = Query(..., description="Año civil de fecha_cancelacion"),
    trimestre: int | None = Query(None, ge=1, le=4),
    _: object = Depends(get_current_user),
    use_case: GetCartera = Depends(get_cartera_use_case),
) -> CarteraCanceladas:
    kwargs = _repo_kwargs(params)
    kwargs["anio"] = anio
    kwargs["trimestre"] = trimestre
    try:
        return use_case.canceladas(**kwargs)
    except CarteraUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/siesa/saldo", response_model=CarteraSiesaSaldo)
def get_siesa(
    params: dict = Depends(_common),
    anio: int | None = Query(None, description="Año civil de fecha_docto"),
    _: object = Depends(get_current_user),
    use_case: GetCartera = Depends(get_cartera_use_case),
) -> CarteraSiesaSaldo:
    try:
        kwargs = _repo_kwargs(params)
        kwargs["anio"] = anio
        return use_case.siesa(**kwargs)
    except CarteraUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


def _repo_kwargs(params: dict) -> dict:
    return {
        key: params[key]
        for key in (
            "as_of",
            "nit",
            "vendedor_rowid",
            "sucursal_cliente_key",
            "id_sucursal",
            "codigo_vendedor",
        )
        if key in params
    }
