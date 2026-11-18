"""The engine's tests run without Postgres: no query database is attached, so
server SQL sees only its inputs. Tests marked `spatial` need DuckDB's spatial
extension, and skip, saying so, where it isn't installed."""

import duckdb
import pytest

from davy_jones_locker import settings


def _spatial_installed() -> bool:
    con = duckdb.connect(":memory:")
    try:
        con.execute("LOAD spatial")
        return True
    except duckdb.Error:
        return False
    finally:
        con.close()


def pytest_configure(config):
    config.addinivalue_line("markers", "spatial: needs DuckDB's spatial extension installed")


def pytest_collection_modifyitems(config, items):
    marked = [item for item in items if item.get_closest_marker("spatial")]
    if not marked or _spatial_installed():
        return
    skip = pytest.mark.skip(
        reason="DuckDB's spatial extension isn't installed: python -m davy_jones_locker.extensions"
    )
    for item in marked:
        item.add_marker(skip)


@pytest.fixture(autouse=True)
def no_query_database(monkeypatch):
    monkeypatch.setattr(settings, "QUERY_DATABASE_URL", "")


@pytest.fixture(autouse=True)
def test_client_host(monkeypatch):
    """TestClient's Host is `testserver`. An engine that signs no one in
    answers only this machine's names (main.local_hosts_only), so the tests'
    name is added as an app would add its own."""
    monkeypatch.setattr(settings, "LOCAL_ALLOWED_HOSTS", ["testserver"])
