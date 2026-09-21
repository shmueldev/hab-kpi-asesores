import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

PREFERRED_DRIVERS = (
    "ODBC Driver 17 for SQL Server",
    "ODBC Driver 18 for SQL Server",
    "SQL Server",
)


def resolve_driver() -> str:
    configured = os.getenv("DB_DRIVER", "").strip()
    try:
        import pyodbc

        installed = set(pyodbc.drivers())
    except Exception:  # noqa: BLE001
        return configured or PREFERRED_DRIVERS[0]

    if configured and configured in installed:
        return configured
    for name in PREFERRED_DRIVERS:
        if name in installed:
            if configured and configured != name:
                logger.info("DB_DRIVER=%s no está instalado; usando %s", configured, name)
            return name
    return configured or PREFERRED_DRIVERS[0]


def build_connection_string() -> str:
    """Construye la cadena de conexión desde DATABASE_URL o partes DB_*."""
    database_url = os.getenv("DATABASE_URL", "").strip()
    if database_url:
        return database_url

    server = os.getenv("DB_SERVER", "192.168.3.155")
    name = os.getenv("DB_NAME", "bdhabEngineer")
    user = os.getenv("DB_USER", "")
    password = os.getenv("DB_PASSWORD", "")
    driver = resolve_driver()

    parts = [
        f"Driver={{{driver}}}",
        f"Server={server}",
        f"Database={name}",
    ]
    if user:
        parts.append(f"UID={user}")
        parts.append(f"PWD={password}")
    else:
        parts.append("Trusted_Connection=yes")
    if "ODBC Driver 18" in driver:
        parts.append("Encrypt=yes")
        parts.append("TrustServerCertificate=yes")
    return ";".join(parts)


def get_connection() -> Any:
    """Abre conexión pyodbc. Lanza excepción si falla."""
    import pyodbc

    conn_str = build_connection_string()
    return pyodbc.connect(conn_str, timeout=8)


def probe_sql_available() -> bool:
    """True si se puede abrir conexión a bdhabEngineer."""
    try:
        conn = get_connection()
        conn.close()
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("SQL no disponible: %s", exc)
        return False
