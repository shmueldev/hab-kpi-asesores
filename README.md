# HAB KPI Asesores

Plataforma para medir asesores: backend FastAPI (hexagonal) y frontend Vite + React. Los KPIs salen de `bdhabEngineer`; si SQL no responde, se muestra el último snapshot guardado en Redis.

```bash
git clone git@github.com:shmueldev/hab-kpi-asesores.git
cd hab-kpi-asesores
```

## Requisitos

- Python **>= 3.12** y [uv](https://github.com/astral-sh/uv)
- Node.js **18+** (o el portable en `.tools/node/node-v20.18.0-win-x64`)
- **ODBC Driver 17 u 18 for SQL Server** y red a `192.168.3.155` (el backend usa el que esté instalado)
- Redis (`docker compose up -d redis`) para el último dato guardado

## Configuración

```bash
copy .env.example .env
copy backend\config\users.example.json backend\config\users.json
```

En `.env`:

- `USE_DEMO_DATA=false` para pegar a `bdhabEngineer`
- Completa `DB_USER` / `DB_PASSWORD` (o `Trusted_Connection` si el usuario de Windows tiene acceso)
- `REDIS_URL=redis://127.0.0.1:6379/0`
- Cambia `JWT_SECRET` en producción

Frontend (`frontend/.env`):

```
VITE_API_URL=http://127.0.0.1:8000
```

Cómo saber la fuente: el tablero muestra un banner **en vivo / Redis / demo**. `GET /health` también reporta `sql`, `redis` y `demo`.

## Arrancar

```bash
docker compose up -d redis

cd backend
uv sync
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

cd frontend
npm install
npm run dev
```

- Health: http://127.0.0.1:8000/health
- Docs: http://127.0.0.1:8000/docs
- UI: http://localhost:5173

`backend/config/users.json` y `.env` no van al repo. Cada máquina copia los `*.example`.

## Usuarios y permisos

El ingreso **no** está en SQL. Cada persona se declara en `backend/config/users.json`.

- Usuario: primer nombre + primer apellido (`fcastro`).
- Primera clave (todos): `HabKpi.2026`. Al entrar deben cambiarla.
- Recuperar: usuario + número de asesor.

| username | role | asesor_key | Visibilidad |
|----------|------|------------|-------------|
| admin | admin | null | Consolidado + filtro por asesor |
| fcastro | asesor | 1 (Fernando Castro) | Solo su cartera |

Detalle: [docs/usuarios.md](docs/usuarios.md).

## Endpoints

- `POST /auth/login`
- `GET /auth/me`
- `GET /asesores` — catálogo `dbo.dim_asesor` (el asesor solo se ve a sí mismo)
- `GET /kpis?fecha_ini=&fecha_fin=&asesor_key=` — Bearer JWT. `asesor_key` solo lo honra el admin.

Respuesta KPI incluye `fuente` (`sql` \| `redis` \| `demo`), `vacio`, `asesor_nombre` y, si vino de Redis, el periodo/fecha del snapshot.

Si SQL y Redis fallan: **503**, no se pintan cifras inventadas.

## KPIs

Fórmulas y tablas: [docs/kpis.md](docs/kpis.md).

## Licencia

Uso interno.
