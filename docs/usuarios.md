# Usuarios y contraseñas

## Convención

- **Usuario:** primer nombre + primer apellido, minúsculas, sin tildes (`fcastro`).
- **Clave temporal genérica:** `HabKpi.2026` (todos la primera vez).
- Al entrar, la plataforma pide **cambiar contraseña**.
- Si la olvidan: **Recuperar contraseña** con usuario + número de asesor (`asesor_key`).

## Piloto para cuadrar

| username | role | asesor_key | Nombre en SQL |
|----------|------|------------|---------------|
| admin | admin | — | Gerencia |
| fcastro | asesor | 1 | Fernando Castro Moreno · UnoEE `vendedor_rowid=45` |

Cartera UnoEE no usa `asesor_key`: se cruza el nombre con `dim_vendedor_unoee` (Castro = rowid 45, código `0001` no se usa porque se repite). Siesa sí: `fact_cartera.codigo_vendedor = asesor_key`. El asesor nunca ve el consolidado; si no hay cruce UnoEE, esa foto sale vacía.

Clave inicial de ambos: `HabKpi.2026`.

## Qué enviar para el resto de la nómina

Una fila: nombre completo, `asesor_key` (el de `dim_asesor`), si es gerente o asesor. Yo armo el usuario; la clave inicial es siempre la genérica.
