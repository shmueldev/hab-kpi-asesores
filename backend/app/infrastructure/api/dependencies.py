import os
from pathlib import Path

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.domain.models import UserInfo
from app.domain.ports.advisor_repository_port import AdvisorRepositoryPort
from app.domain.ports.kpi_cache_port import KpiCachePort
from app.domain.ports.kpi_repository_port import KpiRepositoryPort
from app.domain.ports.monthly_kpi_port import MonthlyKpiPort
from app.domain.ports.cartera_port import CarteraPort
from app.domain.ports.user_repository_port import UserRepositoryPort
from app.domain.ports.vendedor_map_port import VendedorMapPort
from app.domain.vendedor import NO_VENDEDOR_ROWID, resolve_cartera_keys
from app.infrastructure.adapters.memory_vendedor_map import MemoryVendedorMap
from app.infrastructure.adapters.sql_vendedor_map import SqlVendedorMap
from app.infrastructure.adapters.cached_kpi_repository import CachedKpiRepository
from app.infrastructure.adapters.composite_kpi_cache import CompositeKpiCache
from app.infrastructure.adapters.file_kpi_cache import FileKpiCache
from app.infrastructure.adapters.json_user_repository import JsonUserRepository
from app.infrastructure.adapters.memory_kpi_cache import MemoryKpiCache
from app.infrastructure.adapters.memory_kpi_repository import MemoryKpiRepository
from app.infrastructure.adapters.redis_kpi_cache import RedisKpiCache
from app.infrastructure.adapters.sql_kpi_repository import SqlKpiRepository
from app.infrastructure.adapters.memory_cartera_repository import MemoryCarteraRepository
from app.infrastructure.adapters.sql_cartera_repository import SqlCarteraRepository
from app.use_cases.get_cartera import GetCartera
from app.use_cases.get_kpi_dashboard import GetKpiDashboard
from app.use_cases.get_kpi_monthly import GetKpiMonthly
from app.use_cases.list_asesores import ListAsesores
from app.use_cases.login import LoginUseCase, decode_token
from app.use_cases.passwords import ChangePasswordUseCase, RecoverPasswordUseCase

security = HTTPBearer(auto_error=True)

_cache: KpiCachePort | None = None
_sql_repo: SqlKpiRepository | None = None
_users: UserRepositoryPort | None = None
_vendedor_map: VendedorMapPort | None = None


def use_demo_data() -> bool:
    return os.getenv("USE_DEMO_DATA", "").lower() in ("1", "true", "yes")


def get_kpi_cache() -> KpiCachePort:
    global _cache
    if _cache is None:
        memory = MemoryKpiCache()
        disk = FileKpiCache(Path(__file__).resolve().parents[3] / ".cache" / "kpi")
        redis_cache = RedisKpiCache(os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0"))
        _cache = CompositeKpiCache(memory, disk, redis_cache)
    return _cache


def get_sql_repository() -> SqlKpiRepository:
    global _sql_repo
    if _sql_repo is None:
        _sql_repo = SqlKpiRepository()
    return _sql_repo


def get_kpi_repository() -> KpiRepositoryPort:
    if use_demo_data():
        return MemoryKpiRepository()
    return CachedKpiRepository(get_sql_repository(), get_kpi_cache())


def get_advisor_repository() -> AdvisorRepositoryPort:
    if use_demo_data():
        return MemoryKpiRepository()
    return CachedKpiRepository(get_sql_repository(), get_kpi_cache())


def default_users_path() -> Path:
    configured = os.getenv("USERS_FILE", "").strip()
    if configured:
        return Path(configured)
    return Path(__file__).resolve().parents[3] / "config" / "users.json"


def get_user_repository() -> UserRepositoryPort:
    global _users
    if _users is None:
        _users = JsonUserRepository(default_users_path())
    return _users


def get_monthly_repository() -> MonthlyKpiPort:
    if use_demo_data():
        return MemoryKpiRepository()
    return get_sql_repository()


def get_monthly_use_case(
    repo: MonthlyKpiPort = Depends(get_monthly_repository),
) -> GetKpiMonthly:
    return GetKpiMonthly(repo)


def get_vendedor_map() -> VendedorMapPort:
    global _vendedor_map
    if use_demo_data():
        return MemoryVendedorMap()
    if _vendedor_map is None:
        _vendedor_map = SqlVendedorMap()
    return _vendedor_map


def get_cartera_repository() -> CarteraPort:
    if use_demo_data():
        return MemoryCarteraRepository()
    return SqlCarteraRepository()


def get_cartera_use_case(
    repo: CarteraPort = Depends(get_cartera_repository),
) -> GetCartera:
    return GetCartera(repo)


def get_kpi_use_case(
    repo: KpiRepositoryPort = Depends(get_kpi_repository),
    advisors: AdvisorRepositoryPort = Depends(get_advisor_repository),
) -> GetKpiDashboard:
    return GetKpiDashboard(repo, advisors)


def get_asesores_use_case(
    advisors: AdvisorRepositoryPort = Depends(get_advisor_repository),
) -> ListAsesores:
    return ListAsesores(advisors)


def get_login_use_case(
    users: UserRepositoryPort = Depends(get_user_repository),
) -> LoginUseCase:
    return LoginUseCase(users)


def get_change_password_use_case(
    users: UserRepositoryPort = Depends(get_user_repository),
) -> ChangePasswordUseCase:
    return ChangePasswordUseCase(users)


def get_recover_password_use_case(
    users: UserRepositoryPort = Depends(get_user_repository),
) -> RecoverPasswordUseCase:
    return RecoverPasswordUseCase(users)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserInfo:
    try:
        return decode_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_effective_asesor_key(
    asesor_key: int | None = Query(None, description="Filtro de asesor (solo admin)"),
    user: UserInfo = Depends(get_current_user),
) -> int | None:
    """asesor → siempre su key; admin → query o consolidado."""
    if user.role == "asesor":
        return user.asesor_key
    return asesor_key


def get_effective_cartera_keys(
    vendedor_rowid: int | None = Query(None),
    codigo_vendedor: str | None = Query(None),
    asesor_key: int | None = Depends(get_effective_asesor_key),
    user: UserInfo = Depends(get_current_user),
    users: UserRepositoryPort = Depends(get_user_repository),
    mapper: VendedorMapPort = Depends(get_vendedor_map),
) -> dict:
    """Fuerza el vendedor del asesor. Si no hay cruce UnoEE, rowid=-1 (vacío, no el de todos)."""
    override = None
    if user.role == "asesor":
        stored = users.get_by_username(user.username)
        override = stored.vendedor_rowid if stored else None
    mapped = mapper.resolve(asesor_key) if asesor_key is not None else None
    rowid, codigo = resolve_cartera_keys(
        role=user.role,
        user_asesor_key=user.asesor_key,
        requested_asesor_key=asesor_key,
        mapped_rowid=mapped.vendedor_rowid if mapped else None,
        override_rowid=override,
        query_rowid=vendedor_rowid,
        query_codigo=codigo_vendedor,
    )
    return {
        "asesor_key": asesor_key,
        "vendedor_rowid": rowid,
        "codigo_vendedor": codigo,
        "vendedor_nombre": mapped.nombre if mapped else None,
        "sin_vendedor_unoee": rowid == NO_VENDEDOR_ROWID,
    }
