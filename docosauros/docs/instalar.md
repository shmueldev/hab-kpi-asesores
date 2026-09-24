---
title: Instalar y arrancar
---

# Instalar y arrancar

Repositorio: `git@github.com:shmueldev/hab-kpi-asesores.git`.

## Requisitos

- Python **≥ 3.12** y [uv](https://github.com/astral-sh/uv)
- Node.js **18+** (Docusaurus pide **20+**)
- **ODBC Driver 17 u 18 for SQL Server** y red a `192.168.3.155`
- Redis en `127.0.0.1:6379` para el último snapshot y para el mapa de uso

## Configuración

```bash
copy .env.example .env
copy backend\config\users.example.json backend\config\users.json
```

En `.env`:

- `USE_DEMO_DATA=false` para pegar a `bdhabEngineer`
- `DB_USER` / `DB_PASSWORD` (o Trusted Connection)
- `REDIS_URL=redis://127.0.0.1:6379/0`
- `JWT_SECRET` distinto en producción
- Chat: `RESCUEAI_BASE_URL`, `RESCUEAI_API_KEY` (llave virtual de HA, nunca la master) y `RESCUEAI_MODEL=rescue-main`

Frontend (`frontend/.env`):

```
VITE_API_URL=http://127.0.0.1:8000
```

`users.json` y `.env` no van al git.

## Arrancar la plataforma

```bash
docker compose up -d redis

cd backend
uv sync
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

cd frontend
npm install
npm run dev
```

| Qué | URL |
| --- | --- |
| Tablero | http://localhost:5173 |
| Health | http://127.0.0.1:8000/health |
| OpenAPI | http://127.0.0.1:8000/docs |

El tablero muestra un banner **en vivo / Redis / demo**. `GET /health` reporta `sql`, `redis`, `demo` y si RescueAI está configurado.

Si Redis no está arriba, el tablero sigue (memoria + `backend/.cache/kpi`). La vista **Uso** queda vacía hasta que Redis responda.

## Arrancar esta documentación

```bash
cd docosauros
npm start
```

Queda en http://localhost:3000.
