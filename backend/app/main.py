import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

_root = Path(__file__).resolve().parents[2]
load_dotenv(_root / ".env", override=True)
load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)

from app.infrastructure.api.auth_routes import auth_router  # noqa: E402
from app.infrastructure.api.chat_routes import chat_router  # noqa: E402
from app.infrastructure.api.dependencies import get_kpi_cache, use_demo_data  # noqa: E402
from app.use_cases.chat import rescue_configured, rescue_model  # noqa: E402
from app.infrastructure.api.cartera_routes import router as cartera_router  # noqa: E402
from app.infrastructure.api.pedido_routes import router as pedido_router  # noqa: E402
from app.infrastructure.api.uso_routes import router as uso_router  # noqa: E402
from app.infrastructure.api.routes import router  # noqa: E402
from app.infrastructure.database.db import probe_sql_available  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="KPI Platform API", version="0.2.0")

origins = [
    o.strip()
    for o in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174",
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(router)
app.include_router(chat_router)
app.include_router(cartera_router)
app.include_router(pedido_router)
app.include_router(uso_router)


@app.get("/health")
def health() -> dict:
    demo = use_demo_data()
    sql_ok = False if demo else probe_sql_available()
    redis_ok = get_kpi_cache().ping()
    return {
        "status": "ok",
        "demo": demo,
        "sql": sql_ok,
        "redis": redis_ok,
        "database": os.getenv("DB_NAME", "bdhabEngineer"),
        "rescueai": rescue_configured(),
        "rescueai_model": rescue_model() if rescue_configured() else None,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
