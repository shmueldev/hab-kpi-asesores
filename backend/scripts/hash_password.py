"""Genera un hash bcrypt para pegar en config/users.json.

Uso:
  cd backend
  uv run python scripts/hash_password.py "tu-clave"
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.infrastructure.security import hash_password  # noqa: E402


def main() -> None:
    if len(sys.argv) < 2:
        print("Uso: python scripts/hash_password.py \"clave\"")
        sys.exit(1)
    print(hash_password(sys.argv[1]))


if __name__ == "__main__":
    main()
