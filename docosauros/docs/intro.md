---
sidebar_position: 1
title: Qué es
---

# HAB KPI Asesores

Plataforma interna para medir asesores. El tablero (Vite + React) pide números al backend FastAPI; esos números salen de **bdhabEngineer**. Si SQL no responde, se muestra el último snapshot en Redis o en disco. Si no hay SQL ni snapshot, el API responde **503**: no se inventan cifras.

El encabezado del producto es el mismo que ves aquí: **Señal comercial** · Desempeño de asesores. Paleta navy `#061953`, acento `#0b31a5` y highlight `#8bc7f7`.

## Qué ve cada rol

| Rol | Qué puede ver |
| --- | --- |
| **Asesor** | Solo su KPI, pedidos y cartera. Nunca el consolidado. |
| **Admin** | El mismo tablero + filtro de asesor (incluye **Todos** = compañía) + vista **Uso**. |

El ingreso no está en SQL. Las cuentas viven en `backend/config/users.json`.

## De dónde salen los números

- **Ventas / meta / autogestión:** `fact_presupuesto`, `fact_ventas`, `dim_trm`, `fact_pedido`, `dim_canal_pedido`, `dim_asesor`.
- **Pedidos:** `fact_pedido` + `dim_canal_pedido`. No hay embudo ni visitas.
- **Cartera UnoEE:** `fact_cartera_unoee` (abierta, aging, canceladas).
- **Cartera Siesa:** `fact_cartera`. **No se hace JOIN entre esos dos hechos.**

## Cómo leer esta guía

1. [Instalar y arrancar](./instalar.md)
2. [Tablero](./tablero.md), [KPIs](./kpis.md) y [cartera](./cartera.md)
3. [Chat RescueAI](./chat.md) y [uso diario](./uso.md)
4. [API](./api.md) y [reglas que no se rompen](./reglas.md)
