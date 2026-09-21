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

## Validación

Para un rango fijo y un `asesor_key` conocido, los tres % deben coincidir con una query de control sobre las mismas tablas. Si SQL no responde, el API sirve el último snapshot de Redis y lo declara en `fuente=redis`.
