---
title: Tablero
---

# Tablero

Home en `/`. Cuatro tarjetas KPI en **2 arriba y 2 abajo**, más **Cartera abierta** en la misma fila de KPIs. Las cifras esperan el paquete completo (`DashPack`) para no pintar a medias y luego saltar.

## Filtros

- Año y trimestre (Q1–Q4)
- El admin elige asesor o **Todos** (UnoEE / compañía)
- La cartera abierta del home usa el **año** seleccionado (`YEAR(fecha_docto)`)

## Detalles

| Ruta | Contenido |
| --- | --- |
| `/detalle/cumplimiento` | Meta vs venta, meses, tablas con franja azul |
| `/detalle/crecimiento` | YoY y meses |
| `/detalle/autogestion` | Mix autogestión |
| `/detalle/cartera` | UnoEE abierta / aging / canceladas y Siesa |
| `/detalle/pedidos` | Volumen y canal de `fact_pedido` |
| `/uso` | Solo admin: mapa diario de pantallas |

Las gráficas de detalle **no repiten** las del home: áreas, carriles de dinero, barras con signo, cubetas horizontales, composición 100 %. No hay embudo, ranking inventado ni heatmap de ventas.

## Extra de producto

- Tema claro / oscuro profesional (no neón)
- Tour en el primer ingreso
- Tablas paginadas (12 filas), búsqueda, clic en fila, CSV con clic derecho (UTF-8 BOM, `;` para Excel ES)
- Botón circular de rueda: sube o baja según el scroll
- Chat a la derecha (no es una página)
- Alerta si el trimestre ya pasó la mitad y el cumplimiento va bajo 80 %
- Imprimir / PDF desde el encabezado
