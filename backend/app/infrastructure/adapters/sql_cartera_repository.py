"""Cartera UnoEE y Siesa. Dos hechos, sin JOIN entre ellos."""

from __future__ import annotations

from datetime import date

from app.domain.cartera import cubeta_label, days_overdue, days_to_due
from app.domain.models import (
    CarteraAbierta,
    CarteraAging,
    CarteraAgingRow,
    CarteraBucket,
    CarteraCanceladaRow,
    CarteraCanceladas,
    CarteraFilter,
    CarteraSerie,
    CarteraSiesaRow,
    CarteraSiesaSaldo,
)
from app.domain.ports.cartera_port import CarteraPort
from app.infrastructure.database.db import get_connection

UNOEE_WHERE = """
    (? IS NULL OR f.nit = ?)
AND (? IS NULL OR f.vendedor_rowid = ?)
AND (? IS NULL OR f.sucursal_cliente_key = ?)
AND (? IS NULL OR sc.id_sucursal = ?)
"""

ABIERTA_SQL = f"""
SELECT
    COALESCE(SUM(CASE WHEN f.estado_cartera = N'ABIERTA' THEN f.valor ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN f.estado_cartera = N'ABIERTA' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN f.estado_cartera = N'ABIERTA' AND f.fecha_vcto IS NOT NULL
        AND DATEDIFF(day, f.fecha_vcto, ?) <= 0 THEN f.valor ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN f.estado_cartera = N'ABIERTA' AND f.fecha_vcto IS NOT NULL
        AND DATEDIFF(day, f.fecha_vcto, ?) <= 0 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN f.estado_cartera = N'ABIERTA' AND f.fecha_vcto IS NOT NULL
        AND DATEDIFF(day, f.fecha_vcto, ?) BETWEEN 1 AND 30 THEN f.valor ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN f.estado_cartera = N'ABIERTA' AND f.fecha_vcto IS NOT NULL
        AND DATEDIFF(day, f.fecha_vcto, ?) BETWEEN 1 AND 30 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN f.estado_cartera = N'ABIERTA' AND f.fecha_vcto IS NOT NULL
        AND DATEDIFF(day, f.fecha_vcto, ?) > 30 THEN f.valor ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN f.estado_cartera = N'ABIERTA' AND f.fecha_vcto IS NOT NULL
        AND DATEDIFF(day, f.fecha_vcto, ?) > 30 THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN f.estado_cartera = N'ABIERTA' AND f.fecha_vcto IS NULL THEN f.valor ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN f.estado_cartera = N'ABIERTA' AND f.fecha_vcto IS NULL THEN 1 ELSE 0 END), 0)
FROM dbo.fact_cartera_unoee f
LEFT JOIN dbo.dim_sucursal_cliente sc ON sc.sucursal_cliente_key = f.sucursal_cliente_key
WHERE {UNOEE_WHERE}
"""

AGING_SQL = f"""
SELECT
    f.nit,
    cl.razon_social,
    sc.id_sucursal,
    sc.descripcion_sucursal,
    LTRIM(RTRIM(ISNULL(vu.vendedor_codigo, ''))) + N' - ' + LTRIM(RTRIM(ISNULL(vu.nombre_vendedor, ''))),
    f.tipo_docto_cruce,
    f.consec_docto_cruce,
    f.nro_cuota_cruce,
    CAST(f.fecha_vcto AS date),
    f.valor
FROM dbo.fact_cartera_unoee f
LEFT JOIN dbo.dim_cliente cl ON cl.nit = f.nit
LEFT JOIN dbo.dim_sucursal_cliente sc ON sc.sucursal_cliente_key = f.sucursal_cliente_key
LEFT JOIN dbo.dim_vendedor_unoee vu ON vu.vendedor_rowid = f.vendedor_rowid
WHERE f.estado_cartera = N'ABIERTA'
  AND {UNOEE_WHERE}
ORDER BY f.valor DESC
"""

CANCELADAS_Q_SQL = f"""
SELECT c.trimestre, COUNT(*)
FROM dbo.fact_cartera_unoee f
INNER JOIN dbo.dim_calendario c ON CAST(c.fecha AS date) = CAST(f.fecha_cancelacion AS date)
LEFT JOIN dbo.dim_sucursal_cliente sc ON sc.sucursal_cliente_key = f.sucursal_cliente_key
WHERE f.estado_cartera = N'CANCELADA'
  AND c.anio = ?
  AND (? IS NULL OR c.trimestre = ?)
  AND {UNOEE_WHERE}
GROUP BY c.trimestre
"""

CANCELADAS_DET_SQL = f"""
SELECT
    f.nit,
    cl.razon_social,
    sc.id_sucursal,
    sc.descripcion_sucursal,
    f.tipo_docto_cruce,
    f.consec_docto_cruce,
    f.nro_cuota_cruce,
    CAST(f.fecha_docto AS date),
    CAST(f.fecha_cancelacion AS date),
    f.valor
FROM dbo.fact_cartera_unoee f
INNER JOIN dbo.dim_calendario c ON CAST(c.fecha AS date) = CAST(f.fecha_cancelacion AS date)
LEFT JOIN dbo.dim_cliente cl ON cl.nit = f.nit
LEFT JOIN dbo.dim_sucursal_cliente sc ON sc.sucursal_cliente_key = f.sucursal_cliente_key
WHERE f.estado_cartera = N'CANCELADA'
  AND c.anio = ?
  AND (? IS NULL OR c.trimestre = ?)
  AND {UNOEE_WHERE}
ORDER BY f.fecha_cancelacion DESC
"""

SIESA_SQL = """
SELECT
    COALESCE(SUM(total), 0),
    COALESCE(COUNT(*), 0)
FROM dbo.fact_cartera
WHERE (? IS NULL OR nit = ?)
  AND (? IS NULL OR codigo_vendedor = ?)
"""

SIESA_DET_SQL = """
SELECT TOP 200
    nit, razon_social, numero, tipo_docto_cruce, codigo_vendedor,
    CAST(fecha_docto AS date), CAST(fecha_vcto AS date), plazo, dias_vencidos, total
FROM dbo.fact_cartera
WHERE (? IS NULL OR nit = ?)
  AND (? IS NULL OR codigo_vendedor = ?)
ORDER BY total DESC
"""


def _unoee_params(filters: CarteraFilter) -> tuple:
    return (
        filters.nit,
        filters.nit,
        filters.vendedor_rowid,
        filters.vendedor_rowid,
        filters.sucursal_cliente_key,
        filters.sucursal_cliente_key,
        filters.id_sucursal,
        filters.id_sucursal,
    )


def _as_date(value) -> date | None:
    if value is None:
        return None
    if isinstance(value, date):
        return value
    return value.date() if hasattr(value, "date") else None


class SqlCarteraRepository(CarteraPort):
    def get_abierta(self, filters: CarteraFilter) -> CarteraAbierta:
        conn = get_connection()
        try:
            cursor = conn.cursor()
            as_of = filters.as_of
            cursor.execute(ABIERTA_SQL, (as_of, as_of, as_of, as_of, as_of, as_of, *_unoee_params(filters)))
            row = cursor.fetchone()
            return _abierta_from_row(as_of, row)
        finally:
            conn.close()

    def get_aging(self, filters: CarteraFilter) -> CarteraAging:
        resumen = self.get_abierta(filters)
        conn = get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(AGING_SQL, _unoee_params(filters))
            detalle: list[CarteraAgingRow] = []
            vend: dict[str, CarteraSerie] = {}
            cli: dict[str, CarteraSerie] = {}
            for r in cursor.fetchall():
                vcto = _as_date(r[8])
                d = days_overdue(vcto, filters.as_of)
                row = CarteraAgingRow(
                    nit=str(r[0]) if r[0] is not None else None,
                    razon_social=str(r[1]) if r[1] is not None else None,
                    id_sucursal=str(r[2]) if r[2] is not None else None,
                    descripcion_sucursal=str(r[3]) if r[3] is not None else None,
                    vendedor_codigo_nombre=str(r[4]).strip(" -") if r[4] else None,
                    tipo_docto_cruce=str(r[5]) if r[5] is not None else None,
                    consec_docto_cruce=int(r[6]) if r[6] is not None else None,
                    nro_cuota_cruce=int(r[7]) if r[7] is not None else None,
                    fecha_vcto=vcto,
                    cubeta=cubeta_label(d),
                    valor=float(r[9] or 0),
                    dias_a_vcto=days_to_due(vcto, filters.as_of),
                )
                detalle.append(row)
                vname = row.vendedor_codigo_nombre or "Sin vendedor"
                vend.setdefault(vname, CarteraSerie(nombre=vname))
                vend[vname].monto += row.valor
                vend[vname].n += 1
                cname = f"{row.nit or ''} {row.razon_social or ''}".strip() or "Sin cliente"
                cli.setdefault(cname, CarteraSerie(nombre=cname))
                cli[cname].monto += row.valor
                cli[cname].n += 1
            top = sorted(cli.values(), key=lambda x: x.monto, reverse=True)[:15]
            return CarteraAging(
                as_of=filters.as_of,
                resumen=resumen,
                por_vendedor=sorted(vend.values(), key=lambda x: x.monto, reverse=True),
                top_clientes=top,
                detalle=detalle[:400],
                fuente="sql",
            )
        finally:
            conn.close()

    def get_canceladas(self, filters: CarteraFilter) -> CarteraCanceladas:
        if filters.anio is None:
            raise ValueError("anio es obligatorio para canceladas")
        conn = get_connection()
        try:
            cursor = conn.cursor()
            params = (filters.anio, filters.trimestre, filters.trimestre, *_unoee_params(filters))
            cursor.execute(CANCELADAS_Q_SQL, params)
            qs = {1: None, 2: None, 3: None, 4: None}
            if filters.trimestre:
                qs = {1: None, 2: None, 3: None, 4: None}
            else:
                qs = {1: 0, 2: 0, 3: 0, 4: 0}
            total = 0
            for r in cursor.fetchall():
                q = int(r[0])
                n = int(r[1] or 0)
                if q in qs:
                    qs[q] = n
                    total += n
            cursor.execute(CANCELADAS_DET_SQL, params)
            detalle = [
                CarteraCanceladaRow(
                    nit=str(r[0]) if r[0] is not None else None,
                    razon_social=str(r[1]) if r[1] is not None else None,
                    id_sucursal=str(r[2]) if r[2] is not None else None,
                    descripcion_sucursal=str(r[3]) if r[3] is not None else None,
                    tipo_docto_cruce=str(r[4]) if r[4] is not None else None,
                    consec_docto_cruce=int(r[5]) if r[5] is not None else None,
                    nro_cuota_cruce=int(r[6]) if r[6] is not None else None,
                    fecha_docto=_as_date(r[7]),
                    fecha_cancelacion=_as_date(r[8]),
                    valor=float(r[9] or 0),
                )
                for r in cursor.fetchall()[:400]
            ]
            return CarteraCanceladas(
                anio=filters.anio,
                trimestre=filters.trimestre,
                q1=qs[1],
                q2=qs[2],
                q3=qs[3],
                q4=qs[4],
                total=total,
                detalle=detalle,
                fuente="sql",
            )
        finally:
            conn.close()

    def get_siesa_saldo(self, filters: CarteraFilter) -> CarteraSiesaSaldo:
        conn = get_connection()
        try:
            cursor = conn.cursor()
            codigo = _siesa_codigo(filters.codigo_vendedor)
            params = (filters.nit, filters.nit, codigo, codigo)
            cursor.execute(SIESA_SQL, params)
            row = cursor.fetchone()
            cursor.execute(SIESA_DET_SQL, params)
            detalle = [
                CarteraSiesaRow(
                    nit=str(r[0]) if r[0] is not None else None,
                    razon_social=str(r[1]) if r[1] is not None else None,
                    numero=str(r[2]) if r[2] is not None else None,
                    tipo_docto_cruce=str(r[3]) if r[3] is not None else None,
                    codigo_vendedor=str(r[4]) if r[4] is not None else None,
                    fecha_docto=_as_date(r[5]),
                    fecha_vcto=_as_date(r[6]),
                    plazo=int(r[7]) if r[7] is not None else None,
                    dias_vencidos=int(r[8]) if r[8] is not None else None,
                    total=float(r[9] or 0),
                )
                for r in cursor.fetchall()
            ]
            return CarteraSiesaSaldo(
                saldo_cartera=float(row[0] or 0) if row else 0.0,
                n_docs=int(row[1] or 0) if row else 0,
                detalle=detalle,
                fuente="sql",
            )
        finally:
            conn.close()


def _siesa_codigo(value: str | None):
    if value is None or value == "":
        return None
    try:
        return int(value)
    except ValueError:
        return value


def _abierta_from_row(as_of: date, row) -> CarteraAbierta:
    if not row:
        return CarteraAbierta(as_of=as_of, fuente="sql")
    return CarteraAbierta(
        as_of=as_of,
        abierta=float(row[0] or 0),
        n_abiertas=int(row[1] or 0),
        al_dia=CarteraBucket(monto=float(row[2] or 0), n=int(row[3] or 0)),
        gracia=CarteraBucket(monto=float(row[4] or 0), n=int(row[5] or 0)),
        vencida=CarteraBucket(monto=float(row[6] or 0), n=int(row[7] or 0)),
        sin_vcto=CarteraBucket(monto=float(row[8] or 0), n=int(row[9] or 0)),
        fuente="sql",
    )
