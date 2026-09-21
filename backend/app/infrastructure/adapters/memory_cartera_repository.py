from datetime import date, timedelta

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


class MemoryCarteraRepository(CarteraPort):
    def get_abierta(self, filters: CarteraFilter) -> CarteraAbierta:
        return CarteraAbierta(
            as_of=filters.as_of,
            abierta=1_200_000,
            n_abiertas=3,
            al_dia=CarteraBucket(monto=500_000, n=1),
            gracia=CarteraBucket(monto=300_000, n=1),
            vencida=CarteraBucket(monto=400_000, n=1),
            sin_vcto=CarteraBucket(monto=0, n=0),
            fuente="demo",
        )

    def get_aging(self, filters: CarteraFilter) -> CarteraAging:
        as_of = filters.as_of
        rows = [
            (as_of + timedelta(days=10), 500_000, "1. Al día"),
            (as_of - timedelta(days=10), 300_000, "2. Gracia 30 días"),
            (as_of - timedelta(days=45), 400_000, "3. Vencida"),
        ]
        detalle = []
        for i, (vcto, valor, _label) in enumerate(rows, start=1):
            d = days_overdue(vcto, as_of)
            detalle.append(
                CarteraAgingRow(
                    nit=f"90000{i}",
                    razon_social=f"Cliente demo {i}",
                    id_sucursal="01",
                    descripcion_sucursal="Principal",
                    vendedor_codigo_nombre="01 - Demo UnoEE",
                    tipo_docto_cruce="FV",
                    consec_docto_cruce=100 + i,
                    nro_cuota_cruce=1,
                    fecha_vcto=vcto,
                    cubeta=cubeta_label(d),
                    valor=valor,
                    dias_a_vcto=days_to_due(vcto, as_of),
                )
            )
        return CarteraAging(
            as_of=as_of,
            resumen=self.get_abierta(filters),
            por_vendedor=[CarteraSerie(nombre="01 - Demo UnoEE", monto=1_200_000, n=3)],
            top_clientes=[CarteraSerie(nombre=r.razon_social or "", monto=r.valor, n=1) for r in detalle],
            detalle=detalle,
            fuente="demo",
        )

    def get_canceladas(self, filters: CarteraFilter) -> CarteraCanceladas:
        anio = filters.anio or date.today().year
        counts = {1: 12, 2: 9, 3: 15, 4: 4}
        if filters.trimestre:
            counts = {q: (counts[q] if q == filters.trimestre else None) for q in counts}
        total = sum(n or 0 for n in counts.values())
        return CarteraCanceladas(
            anio=anio,
            trimestre=filters.trimestre,
            q1=counts[1],
            q2=counts[2],
            q3=counts[3],
            q4=counts[4],
            total=total,
            detalle=[
                CarteraCanceladaRow(
                    nit="900001",
                    razon_social="Cliente demo 1",
                    id_sucursal="01",
                    descripcion_sucursal="Principal",
                    tipo_docto_cruce="FV",
                    consec_docto_cruce=88,
                    nro_cuota_cruce=1,
                    fecha_docto=date(anio, 2, 1),
                    fecha_cancelacion=date(anio, 3, 10),
                    valor=80_000,
                )
            ],
            fuente="demo",
        )

    def get_siesa_saldo(self, filters: CarteraFilter) -> CarteraSiesaSaldo:
        return CarteraSiesaSaldo(
            saldo_cartera=980_000,
            n_docs=2,
            detalle=[
                CarteraSiesaRow(
                    nit="900001",
                    razon_social="Cliente demo 1",
                    numero="FV-1",
                    tipo_docto_cruce="FV",
                    codigo_vendedor="01",
                    fecha_docto=date(2026, 1, 15),
                    fecha_vcto=date(2026, 2, 14),
                    plazo=30,
                    dias_vencidos=20,
                    total=500_000,
                ),
                CarteraSiesaRow(
                    nit="900002",
                    razon_social="Cliente demo 2",
                    numero="FV-2",
                    tipo_docto_cruce="FV",
                    codigo_vendedor="01",
                    fecha_docto=date(2026, 3, 1),
                    fecha_vcto=date(2026, 3, 31),
                    plazo=30,
                    dias_vencidos=5,
                    total=480_000,
                ),
            ],
            fuente="demo",
        )
