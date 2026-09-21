from pathlib import Path

import pytest

from app.domain.models import LoginRequest
from app.infrastructure.adapters.json_user_repository import JsonUserRepository
from app.infrastructure.security import hash_password, verify_password
from app.use_cases.login import LoginUseCase, decode_token


def test_hash_roundtrip():
    hashed = hash_password("clave-secreta")
    assert hashed != "clave-secreta"
    assert verify_password("clave-secreta", hashed)
    assert not verify_password("otra", hashed)


def test_login_from_users_file(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    users_file = tmp_path / "users.json"
    hashed = hash_password("admin123")
    users_file.write_text(
        '{"users":[{"username":"admin","password_hash":"%s","role":"admin","asesor_key":null,"nombre":"Admin"}]}'
        % hashed,
        encoding="utf-8",
    )
    uc = LoginUseCase(JsonUserRepository(users_file))
    token = uc.execute(LoginRequest(username="admin", password="admin123"))
    assert token.role == "admin"
    info = decode_token(token.access_token)
    assert info.username == "admin"


def test_login_rejects_bad_password(tmp_path: Path):
    hashed = hash_password("admin123")
    path = tmp_path / "users.json"
    path.write_text(
        '{"users":[{"username":"admin","password_hash":"%s","role":"admin","asesor_key":null}]}'
        % hashed,
        encoding="utf-8",
    )
    uc = LoginUseCase(JsonUserRepository(path))
    try:
        uc.execute(LoginRequest(username="admin", password="no"))
    except ValueError as exc:
        assert "inválidas" in str(exc)
        return
    raise AssertionError("debía rechazar")
