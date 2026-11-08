"""The engine's tests run without Postgres: no query database is attached, so
server SQL sees only its inputs."""

import pytest

from davy_jones_locker import settings


@pytest.fixture(autouse=True)
def no_query_database(monkeypatch):
    monkeypatch.setattr(settings, "QUERY_DATABASE_URL", "")


@pytest.fixture(autouse=True)
def test_client_host(monkeypatch):
    """TestClient's Host is `testserver`. An engine that signs no one in
    answers only this machine's names (main.local_hosts_only), so the tests'
    name is added as an app would add its own."""
    monkeypatch.setattr(settings, "LOCAL_ALLOWED_HOSTS", ["testserver"])
