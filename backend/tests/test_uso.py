from datetime import date

from app.domain.models import UserInfo
from app.domain.uso import parse_screen
from app.infrastructure.adapters.memory_uso_store import MemoryUsoStore
from app.use_cases.track_uso import TrackUso


def test_parse_screen_rejects_junk():
    assert parse_screen("home") == "home"
    assert parse_screen("hover") is None
    assert parse_screen("chat") == "chat"


def test_track_counts_and_path():
    store = MemoryUsoStore()
    use = TrackUso(store)
    user = UserInfo(username="fcastro", role="asesor", asesor_key=1, nombre="Fernando")
    day = date(2026, 9, 23)
    use.ping(user, "login", day)
    use.ping(user, "home", day)
    use.ping(user, "home", day)
    use.ping(user, "cartera", day)
    report = use.report(day)
    assert report.activos == 1
    assert report.total_hits == 4
    row = report.usuarios[0]
    assert row.screens["home"] == 2
    assert row.path == ["login", "home", "cartera"]
