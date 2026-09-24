---
title: Arquitectura
---

# Arquitectura

Hexagonal: dominio → puertos → casos de uso → adaptadores → API FastAPI.

```
frontend (Vite + React)
        │  JWT
        ▼
backend FastAPI
  auth / kpis / meses / cartera / pedidos / chat / uso
        │
        ├── SQL Server  bdhabEngineer
        ├── Redis       snapshot KPI + uso:dia:*
        ├── disco       backend/.cache/kpi
        └── users.json  cuentas y bcrypt
```

## Caché de KPI

Compuesta: memoria → archivo → Redis. Clave periodo + asesor. Si SQL cae, se sirve el último snapshot y `fuente=redis` (o disco).

## Alcance

`get_effective_asesor_key` y `get_effective_cartera_keys` ignoran el `asesor_key` que mande un asesor. El admin sí puede filtrar.

Alexis (`asesor_key = 114`) tiene el ajuste TRM hardcodeado como en el SQL de negocio.

`USE_DEMO_DATA=true` es solo local sin red. En producción no se usa: si no hay dato, 503.

## Front

React Router, Recharts, caché de sesión `DashPack` (kpi + meses + cartera + spark) para no parpadear. Tema `data-theme`.
