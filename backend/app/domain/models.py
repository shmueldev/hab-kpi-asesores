from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

DataFuente = Literal["sql", "redis", "demo"]


class KpiFilter(BaseModel):
    fecha_ini: date
    fecha_fin: date
    fecha_ini_aa: date
    fecha_fin_aa: date
    asesor_key: int | None = None


class KpiDashboard(BaseModel):
    total_meta: float = 0.0
    venta_int: float = 0.0
    pct_cumpl_presupuesto: float = 0.0
    total_ventas: float = 0.0
    ventas_aa: float = 0.0
    pct_crecimiento_dinero: float = 0.0
    venta_autogestion: float = 0.0
    pct_autogestion: float = 0.0
    fuente: DataFuente = "demo"
    vacio: bool = False
    asesor_key: int | None = None
    asesor_nombre: str | None = None
    guardado_en: datetime | None = None
    periodo_guardado_ini: date | None = None
    periodo_guardado_fin: date | None = None


class KpiMonthRow(BaseModel):
    anio: int
    mes: int
    mes_texto: str
    venta_actual: float = 0.0
    venta_int: float = 0.0
    total_meta: float = 0.0
    ventas_aa: float = 0.0
    venta_autogestion: float = 0.0
    pct_cumplimiento: float = 0.0
    pct_crecimiento: float = 0.0
    pct_autogestion: float = 0.0
    acumulado_vs_aa: float = 0.0
    proyeccion_cierre: float = 0.0
    es_total: bool = False


class KpiMonthlyBreakdown(BaseModel):
    filas: list[KpiMonthRow] = Field(default_factory=list)
    total: KpiMonthRow | None = None
    fuente: DataFuente = "sql"


class CarteraBucket(BaseModel):
    monto: float = 0.0
    n: int = 0


class CarteraAbierta(BaseModel):
    as_of: date
    anio: int | None = None
    abierta: float = 0.0
    n_abiertas: int = 0
    al_dia: CarteraBucket = Field(default_factory=CarteraBucket)
    gracia: CarteraBucket = Field(default_factory=CarteraBucket)
    vencida: CarteraBucket = Field(default_factory=CarteraBucket)
    sin_vcto: CarteraBucket = Field(default_factory=CarteraBucket)
    fuente: DataFuente = "sql"
    asesor_key: int | None = None
    vendedor_rowid: int | None = None
    vendedor_nombre: str | None = None


class CarteraAgingRow(BaseModel):
    nit: str | None = None
    razon_social: str | None = None
    id_sucursal: str | None = None
    descripcion_sucursal: str | None = None
    vendedor_codigo_nombre: str | None = None
    tipo_docto_cruce: str | None = None
    consec_docto_cruce: int | None = None
    nro_cuota_cruce: int | None = None
    fecha_vcto: date | None = None
    cubeta: str | None = None
    valor: float = 0.0
    dias_a_vcto: int | None = None


class CarteraSerie(BaseModel):
    nombre: str
    monto: float = 0.0
    n: int = 0


class CarteraAging(BaseModel):
    as_of: date
    resumen: CarteraAbierta
    por_vendedor: list[CarteraSerie] = Field(default_factory=list)
    top_clientes: list[CarteraSerie] = Field(default_factory=list)
    detalle: list[CarteraAgingRow] = Field(default_factory=list)
    fuente: DataFuente = "sql"


class CarteraCanceladaRow(BaseModel):
    nit: str | None = None
    razon_social: str | None = None
    id_sucursal: str | None = None
    descripcion_sucursal: str | None = None
    tipo_docto_cruce: str | None = None
    consec_docto_cruce: int | None = None
    nro_cuota_cruce: int | None = None
    fecha_docto: date | None = None
    fecha_cancelacion: date | None = None
    valor: float = 0.0


class CarteraCanceladas(BaseModel):
    anio: int
    trimestre: int | None = None
    q1: int | None = None
    q2: int | None = None
    q3: int | None = None
    q4: int | None = None
    total: int = 0
    detalle: list[CarteraCanceladaRow] = Field(default_factory=list)
    fuente: DataFuente = "sql"


class CarteraSiesaRow(BaseModel):
    nit: str | None = None
    razon_social: str | None = None
    numero: str | None = None
    tipo_docto_cruce: str | None = None
    codigo_vendedor: str | None = None
    fecha_docto: date | None = None
    fecha_vcto: date | None = None
    plazo: int | None = None
    dias_vencidos: int | None = None
    total: float = 0.0


class CarteraSiesaSaldo(BaseModel):
    saldo_cartera: float = 0.0
    n_docs: int = 0
    detalle: list[CarteraSiesaRow] = Field(default_factory=list)
    fuente: DataFuente = "sql"


class CarteraFilter(BaseModel):
    as_of: date
    nit: str | None = None
    vendedor_rowid: int | None = None
    sucursal_cliente_key: int | None = None
    id_sucursal: str | None = None
    codigo_vendedor: str | None = None
    anio: int | None = None
    trimestre: int | None = None


class PedidoFilter(BaseModel):
    fecha_ini: date
    fecha_fin: date
    asesor_key: int | None = None
    nit: str | None = None


class PedidoCanal(BaseModel):
    canal: str
    es_autogestion: bool = False
    n: int = 0
    valor: float = 0.0


class PedidoCliente(BaseModel):
    nit: str | None = None
    nombre: str
    n: int = 0
    valor: float = 0.0


class PedidoRow(BaseModel):
    fecha_pedido: date | None = None
    numero: int | None = None
    nit: str | None = None
    cliente: str | None = None
    canal: str | None = None
    valor: float = 0.0
    anulado: bool = False
    espera: bool = False
    fecha_despacho: date | None = None


class PedidoResumen(BaseModel):
    fecha_ini: date
    fecha_fin: date
    n: int = 0
    valor: float = 0.0
    n_anulados: int = 0
    n_espera: int = 0
    n_despachados: int = 0
    por_canal: list[PedidoCanal] = Field(default_factory=list)
    top_clientes: list[PedidoCliente] = Field(default_factory=list)
    detalle: list[PedidoRow] = Field(default_factory=list)
    detalle_tope: int = 200
    fuente: DataFuente = "sql"
    asesor_key: int | None = None
    asesor_nombre: str | None = None


class Asesor(BaseModel):
    asesor_key: int
    nombre: str


class AppUser(BaseModel):
    username: str
    password_hash: str
    role: Literal["admin", "asesor"]
    asesor_key: int | None = None
    nombre: str | None = None
    must_change_password: bool = True
    vendedor_rowid: int | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    asesor_key: int | None = None
    username: str
    nombre: str | None = None
    must_change_password: bool = False


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class RecoverPasswordRequest(BaseModel):
    username: str
    asesor_key: int
    new_password: str


class UserInfo(BaseModel):
    username: str
    role: str
    asesor_key: int | None = Field(default=None)
    nombre: str | None = None
    must_change_password: bool = False
