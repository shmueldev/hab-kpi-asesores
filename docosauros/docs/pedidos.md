---
title: Pedidos
---

# Pedidos

Salen de `fact_pedido` + `dim_canal_pedido`. `intidvendedor` = `asesor_key`.

No hay `dim_estado` ni tablas de visitas. **No se pinta embudo ni heatmap.**

Lo que sí existe:

- **n / valor:** `COUNT(*)` y `SUM(curvalorpedido)` entre `fecha_pedido`
- **canal:** `dim_canal_pedido.canal` (AUTOGESTION, B2B, SHOPIFY, …)
- **anulados / espera / despacho:** flags `intanulado`, `intespera`, `fecha_despacho`

El detalle del API recorta las **200** filas más recientes. En el front hay franja azul, paginación y CSV.
