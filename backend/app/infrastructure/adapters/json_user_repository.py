from __future__ import annotations

import json
from pathlib import Path

from app.domain.models import AppUser
from app.domain.ports.user_repository_port import UserRepositoryPort


class JsonUserRepository(UserRepositoryPort):
    def __init__(self, path: Path) -> None:
        self._path = path
        self._users = self._load()

    def _load(self) -> dict[str, AppUser]:
        if not self._path.exists():
            raise FileNotFoundError(
                f"No existe el archivo de usuarios: {self._path}. "
                "Copia config/users.example.json a config/users.json."
            )
        raw = json.loads(self._path.read_text(encoding="utf-8"))
        items = raw.get("users", raw if isinstance(raw, list) else [])
        users: dict[str, AppUser] = {}
        for item in items:
            user = AppUser.model_validate(item)
            users[user.username.lower()] = user
        return users

    def _persist(self) -> None:
        payload = {
            "users": [u.model_dump() for u in self._users.values()],
        }
        self._path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    def get_by_username(self, username: str) -> AppUser | None:
        return self._users.get(username.lower())

    def save(self, user: AppUser) -> None:
        self._users[user.username.lower()] = user
        self._persist()
