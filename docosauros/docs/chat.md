---
title: Chat RescueAI
---

# Chat RescueAI

Widget a la derecha. No es una ruta. El agente solo habla del **asesor en sesión**, salvo que el usuario sea admin.

## Gateway

Todo el tráfico de modelo va a LiteLLM HAB:

- Base: `https://llm.tirescue.com/v1`
- Alias: `rescue-main` (también existen `rescue-fast`, `rescue-reason`, `rescue-vision`, `rescue-backup`, `rescue-cloud`, `rescue-embed`)
- **No** se usa OpenAI ni nombres de peso
- La llave es la **virtual** de HA, en `.env`, nunca en git
- Si `rescue-cloud` puede entrar en el fallback, no mandar PII

Sin llave o si RescueAI falla, el front muestra el error real (no un dump local de fórmulas).

El backend manda el snapshot del tablero **más los meses** y hallazgos (mejor mes, peor mes, peores meses, consejos). Si no se envían los meses, el modelo inventa que “no hay permiso”.

## Voz

RescueAI **no** tiene alias de audio. La voz es del navegador (`speechSynthesis`, `es-CO`). Por defecto está **encendida**; el botón Silenciar/Hablar guarda `kpi_chat_voice`. El micrófono es opcional (Web Speech). El saludo no corre en cada apertura: hay un intervalo (~12 min).
