class KpiDataUnavailable(Exception):
    """No hay datos en SQL ni snapshot en Redis."""


class CatalogUnavailable(Exception):
    """No hay catálogo de asesores en SQL ni en Redis."""


class CarteraUnavailable(Exception):
    """No hay datos de cartera en SQL."""
