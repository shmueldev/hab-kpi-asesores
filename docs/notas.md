# Notas técnicas

- Arquitectura hexagonal: dominio → puertos → casos de uso → adaptadores (SQL / Redis / memoria / users.json) → API FastAPI.
- Alexis `asesor_key=114` está hardcodeado en la query de venta internacional (ajuste TRM) como en el SQL de negocio.
- Flujo de datos: `bdhabEngineer` primero. Si la extracción falla, se muestra el último snapshot (Redis si está arriba; si no, `backend/.cache/kpi`). Si no hay SQL ni snapshot, el API responde 503 (no inventa cifras).
- En esta máquina el driver instalado es **ODBC Driver 18**; el backend lo detecta si `DB_DRIVER` no coincide.
- `USE_DEMO_DATA=true` es solo para desarrollo local sin red. El front lo marca como demostración.
- Pedidos salen de `fact_pedido` + `dim_canal_pedido`. No hay dim de `idestado` ni hechos de visitas: no se pinta embudo ni heatmap.
- La alerta de “bajo 80 % a mitad de trimestre” es banner en el tablero. No hay SMTP configurado.
- El chat del agente va a RescueAI (`RESCUEAI_BASE_URL` + alias `rescue-main`). No se usa OpenAI ni nombres de peso. Sin llave virtual, ayuda local del snapshot.
- Usuarios y permisos viven en `backend/config/users.json` (`username`, `password_hash`, `role`, `asesor_key`, `nombre`). El `asesor_key` debe existir en `dbo.dim_asesor`.
