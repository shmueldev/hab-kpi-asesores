from pathlib import Path

from app.domain.models import ChangePasswordRequest, LoginRequest, RecoverPasswordRequest
from app.infrastructure.adapters.json_user_repository import JsonUserRepository
from app.infrastructure.security import hash_password
from app.use_cases.login import LoginUseCase
from app.use_cases.passwords import ChangePasswordUseCase, RecoverPasswordUseCase


def _users(path: Path) -> JsonUserRepository:
    hashed = hash_password("HabKpi.2026")
    path.write_text(
        """{"users":[
        {"username":"admin","password_hash":"%s","role":"admin","asesor_key":null,"must_change_password":true},
        {"username":"fcastro","password_hash":"%s","role":"asesor","asesor_key":1,"nombre":"Fernando","must_change_password":true}
        ]}"""
        % (hashed, hashed),
        encoding="utf-8",
    )
    return JsonUserRepository(path)


def test_login_flags_must_change(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    users = _users(tmp_path / "users.json")
    token = LoginUseCase(users).execute(LoginRequest(username="fcastro", password="HabKpi.2026"))
    assert token.must_change_password is True
    assert token.asesor_key == 1


def test_change_password_then_login(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    users = _users(tmp_path / "users.json")
    ChangePasswordUseCase(users).execute(
        "fcastro",
        ChangePasswordRequest(current_password="HabKpi.2026", new_password="NuevaClave.1"),
    )
    token = LoginUseCase(users).execute(LoginRequest(username="fcastro", password="NuevaClave.1"))
    assert token.must_change_password is False


def test_recover_requires_matching_asesor_key(tmp_path: Path):
    users = _users(tmp_path / "users.json")
    try:
        RecoverPasswordUseCase(users).execute(
            RecoverPasswordRequest(username="fcastro", asesor_key=99, new_password="OtraClave.1")
        )
    except ValueError:
        return
    raise AssertionError("debía rechazar key incorrecta")


def test_recover_sets_new_password(tmp_path: Path, monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    users = _users(tmp_path / "users.json")
    RecoverPasswordUseCase(users).execute(
        RecoverPasswordRequest(username="fcastro", asesor_key=1, new_password="Recuperada.1")
    )
    token = LoginUseCase(users).execute(LoginRequest(username="fcastro", password="Recuperada.1"))
    assert token.must_change_password is False
