from datetime import date

from fastapi import HTTPException

from app.domain.models import UserInfo
from app.infrastructure.api.dependencies import get_effective_asesor_key
from app.infrastructure.adapters.memory_kpi_repository import MemoryKpiRepository
from app.use_cases.list_asesores import ListAsesores


def test_asesor_cannot_see_other_key():
    asesor = UserInfo(username="ana", role="asesor", asesor_key=146)
    assert get_effective_asesor_key(asesor_key=999, user=asesor) == 146


def test_admin_can_filter_or_see_all():
    admin = UserInfo(username="boss", role="admin", asesor_key=None)
    assert get_effective_asesor_key(asesor_key=114, user=admin) == 114
    assert get_effective_asesor_key(asesor_key=None, user=admin) is None


def test_asesor_catalog_is_only_self():
    uc = ListAsesores(MemoryKpiRepository())
    items = uc.execute(asesor_key=146)
    assert [a.asesor_key for a in items] == [146]
    assert len(uc.execute()) == 3


def test_unauthorized_decode_raises():
    from app.use_cases.login import decode_token

    try:
        decode_token("no-es-un-jwt")
    except ValueError:
        return
    raise AssertionError("token basura debía fallar")


def test_http_exception_shape():
    # sanity: FastAPI HTTPException still imported for route contract
    err = HTTPException(status_code=503, detail="sin datos")
    assert err.status_code == 503
    assert date.today().year >= 2026
