from datetime import date


def days_overdue(fecha_vcto: date | None, as_of: date) -> int | None:
    if fecha_vcto is None:
        return None
    return (as_of - fecha_vcto).days


def days_to_due(fecha_vcto: date | None, as_of: date) -> int | None:
    if fecha_vcto is None:
        return None
    return (fecha_vcto - as_of).days


def cubeta_label(d: int | None) -> str | None:
    if d is None:
        return None
    if d <= 0:
        return "1. Al día"
    if d <= 30:
        return "2. Gracia 30 días"
    return "3. Vencida"
