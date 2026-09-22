"""Pedidos de fact_pedido. No inventa etapas: no hay dim de estado."""

from __future__ import annotations

from app.domain.models import PedidoCanal, PedidoCliente, PedidoFilter, PedidoResumen, PedidoRow
from app.domain.ports.pedido_port import PedidoPort
from app.infrastructure.database.db import get_connection

DETALLE_TOPE = 200

RESUMEN_SQL = """
SELECT
    COUNT(*),
    COALESCE(SUM(CAST(curvalorpedido AS float)), 0),
    SUM(CASE WHEN intanulado = 1 THEN 1 ELSE 0 END),
    SUM(CASE WHEN intespera = 1 THEN 1 ELSE 0 END),
    SUM(CASE WHEN fecha_despacho IS NOT NULL THEN 1 ELSE 0 END)
FROM dbo.fact_pedido
WHERE fecha_pedido BETWEEN ? AND ?
  AND (? IS NULL OR intidvendedor = ?)
  AND (? IS NULL OR LTRIM(RTRIM(strnit)) = ?)
"""

CANAL_SQL = """
SELECT
    COALESCE(c.canal, 'SIN CANAL'),
    CAST(COALESCE(c.es_autogestion, 0) AS int),
    COUNT(*),
    COALESCE(SUM(CAST(p.curvalorpedido AS float)), 0)
FROM dbo.fact_pedido p
LEFT JOIN dbo.dim_canal_pedido c ON c.canal_key = p.canal_key
WHERE p.fecha_pedido BETWEEN ? AND ?
  AND (? IS NULL OR p.intidvendedor = ?)
  AND (? IS NULL OR LTRIM(RTRIM(p.strnit)) = ?)
GROUP BY COALESCE(c.canal, 'SIN CANAL'), CAST(COALESCE(c.es_autogestion, 0) AS int)
ORDER BY SUM(CAST(p.curvalorpedido AS float)) DESC
"""

CLIENTES_SQL = """
SELECT TOP 12
    LTRIM(RTRIM(strnit)),
    COALESCE(NULLIF(LTRIM(RTRIM(strnombrecliente)), ''), LTRIM(RTRIM(strcliente)), 'Sin nombre'),
    COUNT(*),
    COALESCE(SUM(CAST(curvalorpedido AS float)), 0)
FROM dbo.fact_pedido
WHERE fecha_pedido BETWEEN ? AND ?
  AND (? IS NULL OR intidvendedor = ?)
  AND (? IS NULL OR LTRIM(RTRIM(strnit)) = ?)
GROUP BY LTRIM(RTRIM(strnit)), COALESCE(NULLIF(LTRIM(RTRIM(strnombrecliente)), ''), LTRIM(RTRIM(strcliente)), 'Sin nombre')
ORDER BY SUM(CAST(curvalorpedido AS float)) DESC
"""

DETALLE_SQL = """
SELECT TOP 200
    p.fecha_pedido,
    p.intnumero,
    LTRIM(RTRIM(p.strnit)),
    COALESCE(NULLIF(LTRIM(RTRIM(p.strnombrecliente)), ''), LTRIM(RTRIM(p.strcliente))),
    COALESCE(c.canal, 'SIN CANAL'),
    CAST(p.curvalorpedido AS float),
    CAST(COALESCE(p.intanulado, 0) AS int),
    CAST(COALESCE(p.intespera, 0) AS int),
    p.fecha_despacho
FROM dbo.fact_pedido p
LEFT JOIN dbo.dim_canal_pedido c ON c.canal_key = p.canal_key
WHERE p.fecha_pedido BETWEEN ? AND ?
  AND (? IS NULL OR p.intidvendedor = ?)
  AND (? IS NULL OR LTRIM(RTRIM(p.strnit)) = ?)
ORDER BY p.fecha_pedido DESC, CAST(p.curvalorpedido AS float) DESC
"""


def _params(filters: PedidoFilter) -> tuple:
    nit = (filters.nit or "").strip() or None
    return (
        filters.fecha_ini,
        filters.fecha_fin,
        filters.asesor_key,
        filters.asesor_key,
        nit,
        nit,
    )


class SqlPedidoRepository(PedidoPort):
    def get_resumen(self, filters: PedidoFilter) -> PedidoResumen:
        conn = get_connection()
        try:
            cursor = conn.cursor()
            params = _params(filters)
            cursor.execute(RESUMEN_SQL, params)
            row = cursor.fetchone()
            n = int(row[0] or 0) if row else 0
            valor = float(row[1] or 0) if row else 0.0
            n_anulados = int(row[2] or 0) if row else 0
            n_espera = int(row[3] or 0) if row else 0
            n_despachados = int(row[4] or 0) if row else 0

            cursor.execute(CANAL_SQL, params)
            por_canal = [
                PedidoCanal(
                    canal=str(r[0] or "SIN CANAL"),
                    es_autogestion=bool(r[1]),
                    n=int(r[2] or 0),
                    valor=float(r[3] or 0),
                )
                for r in cursor.fetchall()
            ]

            cursor.execute(CLIENTES_SQL, params)
            top_clientes = [
                PedidoCliente(
                    nit=str(r[0]).strip() if r[0] is not None else None,
                    nombre=str(r[1] or "Sin nombre"),
                    n=int(r[2] or 0),
                    valor=float(r[3] or 0),
                )
                for r in cursor.fetchall()
            ]

            cursor.execute(DETALLE_SQL, params)
            detalle = [
                PedidoRow(
                    fecha_pedido=r[0],
                    numero=int(r[1]) if r[1] is not None else None,
                    nit=str(r[2]).strip() if r[2] is not None else None,
                    cliente=str(r[3]) if r[3] is not None else None,
                    canal=str(r[4]) if r[4] is not None else None,
                    valor=float(r[5] or 0),
                    anulado=bool(r[6]),
                    espera=bool(r[7]),
                    fecha_despacho=r[8],
                )
                for r in cursor.fetchall()
            ]

            return PedidoResumen(
                fecha_ini=filters.fecha_ini,
                fecha_fin=filters.fecha_fin,
                n=n,
                valor=valor,
                n_anulados=n_anulados,
                n_espera=n_espera,
                n_despachados=n_despachados,
                por_canal=por_canal,
                top_clientes=top_clientes,
                detalle=detalle,
                detalle_tope=DETALLE_TOPE,
                fuente="sql",
                asesor_key=filters.asesor_key,
            )
        finally:
            conn.close()
