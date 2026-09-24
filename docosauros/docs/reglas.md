---
title: Reglas que no se rompen
---

# Reglas que no se rompen

Decisiones de producto ya cerradas. Si una petición las contradice, se mantiene esto.

1. **No inventar** embudo, ranking, heatmap de ventas ni etapas de pedido.
2. **Nunca JOIN** de `fact_cartera_unoee` con `fact_cartera`.
3. El asesor **nunca** ve consolidado.
4. Si SQL falla, último snapshot o **503**. Nada de demo en producción.
5. Chat = RescueAI (`rescue-*`). No OpenAI. Llave virtual fuera de git.
6. Uso = Redis **por día**, pantallas, sin hover ni texto.
7. `asesor_key` ≠ `vendedor_rowid`. UnoEE cruza por nombre; Siesa por `codigo_vendedor`.
8. Canceladas es lo único trimestral de cartera; abierta/aging van por `fecha_docto` / `as_of`.
9. No commitear `.env`, `users.json` ni claves.
