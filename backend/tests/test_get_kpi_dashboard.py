from datetime import date

from app.use_cases.get_kpi_dashboard import same_day_prev_year


def test_same_day_prev_year_normal():
    assert same_day_prev_year(date(2026, 3, 15)) == date(2025, 3, 15)


def test_same_day_prev_year_leap():
    assert same_day_prev_year(date(2024, 2, 29)) == date(2023, 2, 28)
