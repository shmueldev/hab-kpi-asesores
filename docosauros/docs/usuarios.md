---
title: Usuarios y permisos
---

# Usuarios y permisos

No viven en SQL. Archivo: `backend/config/users.json` (`username`, `password_hash`, `role`, `asesor_key`, `nombre`). El `asesor_key` debe existir en `dbo.dim_asesor`.

## Convención

- Usuario: inicial del primer nombre + primer apellido, minúsculas, sin tildes (`fcastro`).
- Si dos nombres chocan: se agrega el key (`jmontoya51`).
- Clave temporal de los nuevos: `HabKpi.2026`. Deben cambiarla al entrar (`must_change_password`).
- Recuperar: usuario + número de asesor. Es un control débil; no es un flujo de correo.
- No se siembran genéricos, junior, B2C, inactivos ni `Sin Vendedor`.

```bash
cd backend
uv run python scripts/seed_asesor_users.py
uv run python scripts/write_usuarios_md.py
```

El seed **no pisa** claves existentes (admin y Castro).

La nómina operativa (155 filas, sin hashes) está en [`docs/usuarios.md`](https://github.com/shmueldev/hab-kpi-asesores/blob/main/docs/usuarios.md) del repo, no en este sitio.
