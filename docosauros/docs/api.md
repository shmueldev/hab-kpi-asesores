---
title: API
---

# API

Prefijo del backend (dev): `http://127.0.0.1:8000`. Bearer JWT salvo login, recuperar y `/health`.

| Método | Ruta | Quién |
| --- | --- | --- |
| POST | `/auth/login` | Público |
| GET | `/auth/me` | Sesión |
| POST | `/auth/cambiar-clave` | Sesión |
| POST | `/auth/recuperar` | Usuario + `asesor_key` |
| GET | `/asesores` | Asesor: solo él. Admin: catálogo |
| GET | `/kpis` | Periodo + `asesor_key` (solo admin lo honra) |
| GET | `/kpis/meses` | Misma regla |
| GET | `/pedidos` | Volumen y canal |
| GET | `/cartera/unoee/abierta` | `anio` opcional (`fecha_docto`) |
| GET | `/cartera/unoee/aging` | `anio` opcional |
| GET | `/cartera/unoee/canceladas` | `anio` + trimestre (`fecha_cancelacion`) |
| GET | `/cartera/siesa/saldo` | `anio` opcional |
| POST | `/chat` | RescueAI + snapshot |
| POST | `/uso` | Pantalla válida |
| GET | `/uso` | **Solo admin** |
| GET | `/health` | Público |

Respuesta KPI: `fuente` (`sql` \| `redis` \| `demo`), `vacio`, `asesor_nombre`. Si vino de Redis, trae el periodo del snapshot.

Si SQL y Redis fallan: **503**.
