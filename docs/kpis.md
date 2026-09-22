# Fórmulas KPI (bdhabEngineer)

Fuente SQL: `dbo.fact_presupuesto`, `dbo.fact_ventas`, `dbo.dim_trm`, `dbo.fact_pedido`, `dbo.dim_canal_pedido`, `dbo.dim_asesor`.

## % Cumplimiento presupuesto

`venta_int / meta`

- **meta**: `SUM(fact_presupuesto.meta)` entre `fecha_presupuesto` del periodo, filtrado por `asesor_key` si aplica.
- **venta_int**: ventas del periodo con ajuste TRM para Alexis (`asesor_key = 114`) y el pedido `00000123` a la mitad.

## % Crecimiento dinero

`(total_ventas / ventas_aa) - 1`

- **total_ventas**: `fact_ventas.valor` del periodo (mismo ajuste `00000123`).
- **ventas_aa**: mismo cálculo en el mismo día/mes del año anterior.

## % Autogestión

`venta_autogestion / venta_int`

- **venta_autogestion**: ventas cuyo `NUMEROPEDIDO` está en `fact_pedido` con `dim_canal_pedido.es_autogestion = 1`.

## Pedidos (`fact_pedido`)

No hay embudo ni heatmap: no existen tablas de prospectos, visitas ni un dim de `idestado`.

Lo que sí se muestra, con columnas reales:

- **n / valor**: `COUNT(*)` y `SUM(curvalorpedido)` entre `fecha_pedido` del periodo.
- **canal**: `dim_canal_pedido.canal` (AUTOGESTION, B2B, SHOPIFY, …).
- **intidvendedor** = `asesor_key` (el cruce existe).
- **anulados / espera / despacho**: flags `intanulado`, `intespera`, `fecha_despacho`. No se traducen a etapas inventadas.

El detalle del API se recorta a las 200 filas más recientes.

## Validación

Para un rango fijo y un `asesor_key` conocido, los tres % deben coincidir con una query de control sobre las mismas tablas. Si SQL no responde, el API sirve el último snapshot de Redis y lo declara en `fuente=redis`.
