---
title: Cartera
---

# Cartera

En el home hay **una** tarjeta: Cartera abierta, alineada con los KPIs. El resto vive en `/detalle/cartera`.

Hay **dos hechos**. No se unen.

| Hecho | Qué muestra | Filtro de año |
| --- | --- | --- |
| `fact_cartera_unoee` | Abierta, aging (cubetas), canceladas | Abierta/aging: `YEAR(fecha_docto)`. Canceladas: `fecha_cancelacion` y trimestre. |
| `fact_cartera` (Siesa) | Saldo | Mismo año de documento. |

`as_of` es la foto de abierta/aging (por defecto hoy). No es un trimestre.

## Cubetas (UnoEE)

1. Al día  
2. Gracia 30 días  
3. Vencida  

## Quién ve qué

El `asesor_key` **no** es el `vendedor_rowid` de UnoEE. El cruce es por nombre (`pick_vendedor`). Siesa usa `codigo_vendedor = asesor_key`.

- Si el asesor no tiene `vendedor_rowid`, UnoEE sale en blanco (`NO_VENDEDOR_ROWID = -1`).
- El asesor **nunca** ve consolidado.
- El admin en **Todos** ve compañía.

La nómina con rowid está en `docs/usuarios.md` del repo (no se replica aquí: son 155 cuentas operativas).
