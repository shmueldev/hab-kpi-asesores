from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from app.domain.errors import CatalogUnavailable, KpiDataUnavailable
from app.domain.models import Asesor, KpiDashboard, KpiMonthlyBreakdown, UserInfo
from app.infrastructure.api.dependencies import (
    get_asesores_use_case,
    get_current_user,
    get_effective_asesor_key,
    get_kpi_use_case,
    get_monthly_use_case,
)
from app.use_cases.get_kpi_dashboard import GetKpiDashboard
from app.use_cases.get_kpi_monthly import GetKpiMonthly
from app.use_cases.list_asesores import ListAsesores

router = APIRouter(tags=["kpis"])


@router.get("/kpis", response_model=KpiDashboard)
def get_kpis(
    fecha_ini: date = Query(..., description="Fecha inicio"),
    fecha_fin: date = Query(..., description="Fecha fin"),
    fecha_ini_aa: date | None = Query(None, description="Inicio año anterior (opcional)"),
    fecha_fin_aa: date | None = Query(None, description="Fin año anterior (opcional)"),
    asesor_key: int | None = Depends(get_effective_asesor_key),
    use_case: GetKpiDashboard = Depends(get_kpi_use_case),
) -> KpiDashboard:
    try:
        return use_case.execute(
            fecha_ini=fecha_ini,
            fecha_fin=fecha_fin,
            asesor_key=asesor_key,
            fecha_ini_aa=fecha_ini_aa,
            fecha_fin_aa=fecha_fin_aa,
        )
    except KpiDataUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/kpis/meses", response_model=KpiMonthlyBreakdown)
def get_kpis_meses(
    fecha_ini: date = Query(..., description="Fecha inicio"),
    fecha_fin: date = Query(..., description="Fecha fin"),
    fecha_ini_aa: date | None = Query(None),
    fecha_fin_aa: date | None = Query(None),
    asesor_key: int | None = Depends(get_effective_asesor_key),
    use_case: GetKpiMonthly = Depends(get_monthly_use_case),
) -> KpiMonthlyBreakdown:
    try:
        return use_case.execute(
            fecha_ini=fecha_ini,
            fecha_fin=fecha_fin,
            asesor_key=asesor_key,
            fecha_ini_aa=fecha_ini_aa,
            fecha_fin_aa=fecha_fin_aa,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/asesores", response_model=list[Asesor])
def get_asesores(
    user: UserInfo = Depends(get_current_user),
    use_case: ListAsesores = Depends(get_asesores_use_case),
) -> list[Asesor]:
    try:
        if user.role == "asesor":
            return use_case.execute(asesor_key=user.asesor_key)
        return use_case.execute()
    except CatalogUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
