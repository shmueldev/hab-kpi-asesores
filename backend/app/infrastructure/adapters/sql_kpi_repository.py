"""Adaptador SQL Server: KPIs y catálogo dim_asesor (sin fallback demo)."""

from __future__ import annotations

import logging

from app.domain.models import Asesor, KpiDashboard, KpiFilter, KpiMonthlyBreakdown
from app.domain.monthly import compose_monthly
from app.domain.ports.advisor_repository_port import AdvisorRepositoryPort
from app.domain.ports.kpi_repository_port import KpiRepositoryPort
from app.domain.ports.monthly_kpi_port import MonthlyKpiPort
from app.infrastructure.database.db import get_connection

logger = logging.getLogger(__name__)

ALEXIS_ASESOR_KEY = 114

ASESORES_SQL = """
SELECT asesor_key, nombre_asesor
FROM dbo.dim_asesor
WHERE asesor_key IS NOT NULL
ORDER BY nombre_asesor
"""

KPI_SQL = """
;WITH
meta AS (
    SELECT SUM(meta) AS total_meta
    FROM dbo.fact_presupuesto
    WHERE fecha_presupuesto BETWEEN ? AND ?
      AND (? IS NULL OR asesor_key = ?)
),
venta_int AS (
    SELECT SUM(
        CASE
            WHEN v.asesor_key = 114
                THEN venta_ajustada * COALESCE(t.trm, tu.trm, 1)
            ELSE venta_ajustada
        END
    ) AS venta_int
    FROM (
        SELECT
            asesor_key,
            fecha,
            CASE WHEN LTRIM(RTRIM(numero)) = '00000123' THEN CAST(valor AS float)/2.0 ELSE CAST(valor AS float) END AS venta_ajustada,
            YEAR(fecha)*100 + MONTH(fecha) AS mes_key
        FROM dbo.fact_ventas
        WHERE fecha BETWEEN ? AND ?
          AND (? IS NULL OR asesor_key = ?)
    ) v
    LEFT JOIN dbo.dim_trm t ON t.mes_key = v.mes_key
    CROSS JOIN (SELECT TOP 1 trm FROM dbo.dim_trm ORDER BY mes_key DESC) tu
),
total_ventas AS (
    SELECT SUM(CASE WHEN LTRIM(RTRIM(numero))='00000123' THEN CAST(valor AS float)/2.0 ELSE CAST(valor AS float) END) AS total_ventas
    FROM dbo.fact_ventas
    WHERE fecha BETWEEN ? AND ?
      AND (? IS NULL OR asesor_key = ?)
),
ventas_aa AS (
    SELECT SUM(CASE WHEN LTRIM(RTRIM(numero))='00000123' THEN CAST(valor AS float)/2.0 ELSE CAST(valor AS float) END) AS ventas_aa
    FROM dbo.fact_ventas
    WHERE fecha BETWEEN ? AND ?
      AND (? IS NULL OR asesor_key = ?)
),
venta_auto AS (
    SELECT SUM(CASE WHEN LTRIM(RTRIM(v.numero))='00000123' THEN CAST(v.valor AS float)/2.0 ELSE CAST(v.valor AS float) END) AS venta_autogestion
    FROM dbo.fact_ventas v
    INNER JOIN (
        SELECT DISTINCT LTRIM(RTRIM(CAST(p.intnumero AS varchar(50)))) AS pedido
        FROM dbo.fact_pedido p
        INNER JOIN dbo.dim_canal_pedido c ON c.canal_key = p.canal_key
        WHERE c.es_autogestion = 1
    ) pa ON pa.pedido = LTRIM(RTRIM(CAST(v.NUMEROPEDIDO AS varchar(50))))
    WHERE v.fecha BETWEEN ? AND ?
      AND (? IS NULL OR v.asesor_key = ?)
)
SELECT
    COALESCE(m.total_meta, 0),
    COALESCE(vi.venta_int, 0),
    CAST(COALESCE(vi.venta_int,0) AS float) / NULLIF(CAST(COALESCE(m.total_meta,0) AS float), 0),
    COALESCE(tv.total_ventas, 0),
    COALESCE(va.ventas_aa, 0),
    CAST(COALESCE(tv.total_ventas,0) AS float) / NULLIF(CAST(COALESCE(va.ventas_aa,0) AS float), 0) - 1,
    COALESCE(au.venta_autogestion, 0),
    CAST(COALESCE(au.venta_autogestion,0) AS float) / NULLIF(CAST(COALESCE(vi.venta_int,0) AS float), 0)
FROM meta m CROSS JOIN venta_int vi CROSS JOIN total_ventas tv CROSS JOIN ventas_aa va CROSS JOIN venta_auto au;
"""

META_MONTH_SQL = """
SELECT YEAR(fecha_presupuesto), MONTH(fecha_presupuesto), SUM(meta)
FROM dbo.fact_presupuesto
WHERE fecha_presupuesto BETWEEN ? AND ?
  AND (? IS NULL OR asesor_key = ?)
GROUP BY YEAR(fecha_presupuesto), MONTH(fecha_presupuesto)
"""

VENTAS_MONTH_SQL = """
SELECT YEAR(v.fecha), MONTH(v.fecha),
    SUM(v.venta_ajustada),
    SUM(
        CASE
            WHEN v.asesor_key = 114
                THEN v.venta_ajustada * COALESCE(t.trm, tu.trm, 1)
            ELSE v.venta_ajustada
        END
    )
FROM (
    SELECT
        asesor_key,
        fecha,
        CASE WHEN LTRIM(RTRIM(numero)) = '00000123' THEN CAST(valor AS float)/2.0 ELSE CAST(valor AS float) END AS venta_ajustada
    FROM dbo.fact_ventas
    WHERE fecha BETWEEN ? AND ?
      AND (? IS NULL OR asesor_key = ?)
) v
LEFT JOIN dbo.dim_trm t ON t.mes_key = YEAR(v.fecha) * 100 + MONTH(v.fecha)
CROSS JOIN (SELECT TOP 1 trm FROM dbo.dim_trm ORDER BY mes_key DESC) tu
GROUP BY YEAR(v.fecha), MONTH(v.fecha)
"""

AUTO_MONTH_SQL = """
SELECT YEAR(v.fecha), MONTH(v.fecha),
    SUM(CASE WHEN LTRIM(RTRIM(v.numero))='00000123' THEN CAST(v.valor AS float)/2.0 ELSE CAST(v.valor AS float) END)
FROM dbo.fact_ventas v
INNER JOIN (
    SELECT DISTINCT LTRIM(RTRIM(CAST(p.intnumero AS varchar(50)))) AS pedido
    FROM dbo.fact_pedido p
    INNER JOIN dbo.dim_canal_pedido c ON c.canal_key = p.canal_key
    WHERE c.es_autogestion = 1
) pa ON pa.pedido = LTRIM(RTRIM(CAST(v.NUMEROPEDIDO AS varchar(50))))
WHERE v.fecha BETWEEN ? AND ?
  AND (? IS NULL OR v.asesor_key = ?)
GROUP BY YEAR(v.fecha), MONTH(v.fecha)
"""


def _kpi_params(filters: KpiFilter) -> tuple:
    asesor = filters.asesor_key
    return (
        filters.fecha_ini,
        filters.fecha_fin,
        asesor,
        asesor,
        filters.fecha_ini,
        filters.fecha_fin,
        asesor,
        asesor,
        filters.fecha_ini,
        filters.fecha_fin,
        asesor,
        asesor,
        filters.fecha_ini_aa,
        filters.fecha_fin_aa,
        asesor,
        asesor,
        filters.fecha_ini,
        filters.fecha_fin,
        asesor,
        asesor,
    )


def _row_to_dashboard(row: tuple) -> KpiDashboard:
    return KpiDashboard(
        total_meta=float(row[0] or 0),
        venta_int=float(row[1] or 0),
        pct_cumpl_presupuesto=float(row[2] or 0) if row[2] is not None else 0.0,
        total_ventas=float(row[3] or 0),
        ventas_aa=float(row[4] or 0),
        pct_crecimiento_dinero=float(row[5] or 0) if row[5] is not None else 0.0,
        venta_autogestion=float(row[6] or 0),
        pct_autogestion=float(row[7] or 0) if row[7] is not None else 0.0,
        fuente="sql",
    )


def _pair(filters: KpiFilter, ini, fin) -> tuple:
    return (ini, fin, filters.asesor_key, filters.asesor_key)


class SqlKpiRepository(KpiRepositoryPort, AdvisorRepositoryPort, MonthlyKpiPort):
    def get_kpi_data(self, filters: KpiFilter) -> KpiDashboard:
        conn = get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(KPI_SQL, _kpi_params(filters))
            row = cursor.fetchone()
            if not row:
                return KpiDashboard(fuente="sql")
            return _row_to_dashboard(row)
        finally:
            conn.close()

    def get_monthly_breakdown(self, filters: KpiFilter) -> KpiMonthlyBreakdown:
        conn = get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(META_MONTH_SQL, _pair(filters, filters.fecha_ini, filters.fecha_fin))
            meta = {(int(r[0]), int(r[1])): float(r[2] or 0) for r in cursor.fetchall()}
            cursor.execute(VENTAS_MONTH_SQL, _pair(filters, filters.fecha_ini, filters.fecha_fin))
            ventas = {
                (int(r[0]), int(r[1])): (float(r[2] or 0), float(r[3] or 0)) for r in cursor.fetchall()
            }
            cursor.execute(AUTO_MONTH_SQL, _pair(filters, filters.fecha_ini, filters.fecha_fin))
            auto = {(int(r[0]), int(r[1])): float(r[2] or 0) for r in cursor.fetchall()}
            cursor.execute(VENTAS_MONTH_SQL, _pair(filters, filters.fecha_ini_aa, filters.fecha_fin_aa))
            ventas_aa_por_mes = {int(r[1]): float(r[2] or 0) for r in cursor.fetchall()}
            return compose_monthly(
                filters.fecha_ini,
                filters.fecha_fin,
                meta,
                ventas,
                auto,
                ventas_aa_por_mes,
                fuente="sql",
            )
        finally:
            conn.close()

    def list_asesores(self) -> list[Asesor]:
        conn = get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(ASESORES_SQL)
            return [
                Asesor(asesor_key=int(r[0]), nombre=str(r[1] or f"Asesor {r[0]}"))
                for r in cursor.fetchall()
                if r[0] is not None
            ]
        finally:
            conn.close()

    def get_nombre(self, asesor_key: int) -> str | None:
        conn = get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT nombre_asesor FROM dbo.dim_asesor WHERE asesor_key = ?",
                (asesor_key,),
            )
            row = cursor.fetchone()
            if not row or row[0] is None:
                return None
            return str(row[0])
        finally:
            conn.close()
