from app.domain.models import UserInfo
from app.domain.vendedor import NO_VENDEDOR_ROWID, pick_vendedor, resolve_cartera_keys
from app.infrastructure.adapters.memory_vendedor_map import MemoryVendedorMap
from app.infrastructure.api.dependencies import get_effective_asesor_key


def test_castro_maps_to_unoee_rowid_45():
    match = pick_vendedor(
        "FERNANDO  CASTRO MORENO 1",
        [(45, "CASTRO  FERNANDO"), (57, "MEDINA OCAMPO JONNY ARLEY")],
    )
    assert match is not None
    assert match.vendedor_rowid == 45


def test_ambiguous_name_does_not_guess():
    match = pick_vendedor(
        "ASESOR JUNIOR MOTOS 10",
        [(10, "ASESOR JUNIOR MOTOS 10"), (11, "ASESOR JUNIOR MOTOS 3")],
    )
    assert match is None


def test_asesor_cannot_open_all_cartera():
    rowid, codigo = resolve_cartera_keys(
        role="asesor",
        user_asesor_key=1,
        requested_asesor_key=999,
        mapped_rowid=45,
        override_rowid=None,
        query_rowid=None,
        query_codigo="999",
    )
    assert rowid == 45
    assert codigo == "1"


def test_asesor_without_map_sees_empty_not_consolidated():
    rowid, codigo = resolve_cartera_keys(
        role="asesor",
        user_asesor_key=8,
        requested_asesor_key=8,
        mapped_rowid=None,
        override_rowid=None,
        query_rowid=None,
        query_codigo=None,
    )
    assert rowid == NO_VENDEDOR_ROWID
    assert codigo == "8"


def test_admin_selected_asesor_uses_map():
    rowid, codigo = resolve_cartera_keys(
        role="admin",
        user_asesor_key=None,
        requested_asesor_key=1,
        mapped_rowid=45,
        override_rowid=None,
        query_rowid=99,
        query_codigo="99",
    )
    assert rowid == 45
    assert codigo == "1"


def test_admin_consolidated_keeps_optional_query():
    rowid, codigo = resolve_cartera_keys(
        role="admin",
        user_asesor_key=None,
        requested_asesor_key=None,
        mapped_rowid=None,
        override_rowid=None,
        query_rowid=12,
        query_codigo="12",
    )
    assert rowid == 12
    assert codigo == "12"


def test_override_wins_over_name_map():
    rowid, _codigo = resolve_cartera_keys(
        role="asesor",
        user_asesor_key=1,
        requested_asesor_key=1,
        mapped_rowid=99,
        override_rowid=45,
        query_rowid=None,
        query_codigo=None,
    )
    assert rowid == 45


def test_memory_map_finds_castro():
    assert MemoryVendedorMap().resolve(1).vendedor_rowid == 45


def test_asesor_key_still_forced_on_kpis():
    asesor = UserInfo(username="fcastro", role="asesor", asesor_key=1)
    assert get_effective_asesor_key(asesor_key=999, user=asesor) == 1
