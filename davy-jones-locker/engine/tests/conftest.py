"""The engine's tests run without Postgres: no query database is attached, so
server SQL sees only its inputs."""

import pytest

from davy_jones_locker import settings


@pytest.fixture(autouse=True)
def no_query_database(monkeypatch):
    monkeypatch.setattr(settings, "QUERY_DATABASE_URL", "")
