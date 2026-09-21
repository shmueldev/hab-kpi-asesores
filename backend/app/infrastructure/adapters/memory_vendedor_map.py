from app.domain.ports.vendedor_map_port import VendedorMapPort
from app.domain.vendedor import VendedorMatch, pick_vendedor

_CANDIDATES = [
    (45, "CASTRO  FERNANDO"),
    (99, "Asesor demo"),
]


class MemoryVendedorMap(VendedorMapPort):
    _nombres = {
        1: "FERNANDO  CASTRO MORENO 1",
        146: "Asesor demo",
    }

    def resolve(self, asesor_key: int) -> VendedorMatch | None:
        return pick_vendedor(self._nombres.get(asesor_key, ""), _CANDIDATES)
