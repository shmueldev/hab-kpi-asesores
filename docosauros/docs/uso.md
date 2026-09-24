---
title: Uso diario
---

# Uso diario (Redis)

El admin ve **cómo navegan**, no un heatmap de mouse.

## Qué se guarda

Un hash Redis por día:

```
uso:dia:YYYY-MM-DD
```

Campo = `username`. Valor = JSON con:

- `screens`: visitas por pantalla
- `path`: últimas 8 pantallas distintas consecutivas
- `last_at`, `nombre`, `role`

TTL **90 días**. Zona `America/Bogota` (si Windows no tiene `tzdata`, el backend usa UTC−5).

Pantallas válidas: `login`, `home`, `cumplimiento`, `crecimiento`, `autogestion`, `cartera`, `pedidos`, `chat`.

## Qué no se guarda

Hover, scroll, texto del chat, NIT, payloads. Si llega una pantalla basura, el API responde 400.

## Cómo entra

- `POST /auth/login` cuenta `login` (si Redis falla, el login no se cae)
- El front (`UsageBeacon`) cuenta al cambiar de ruta y al abrir el chat
- `GET /uso?fecha=` es **solo admin**

En el encabezado, el admin tiene el botón **Uso**. `/uso` redirige al home si no es admin.

Sin Redis en `127.0.0.1:6379` la vista dice que Redis no respondió. El tablero de KPIs no depende de esto.
