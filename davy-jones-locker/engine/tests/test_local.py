"""IS_LOCAL: the engine starts only for local development until it has
sign-in, and says so."""

import asyncio

import pytest
from fastapi import FastAPI

from davy_jones_locker import main, settings


async def start(app: FastAPI) -> None:
    async with main.lifespan(app):
        pass


def test_without_is_local_the_engine_refuses_to_start(monkeypatch):
    monkeypatch.setattr(settings, "IS_LOCAL", False)
    with pytest.raises(RuntimeError, match="requires sign-in"):
        asyncio.run(start(FastAPI()))


def test_local_engine_starts_warns_and_says_so(monkeypatch, caplog):
    monkeypatch.setattr(settings, "IS_LOCAL", True)
    monkeypatch.setattr(settings, "DATABASE_URL", "")
    asyncio.run(start(FastAPI()))
    assert "node kinds can reach the network" in caplog.text
    assert main.health()["local"] is True


def test_a_kind_may_ask_for_the_network_only_when_local():
    from davy_jones_locker import nodes

    fetch = nodes.NodeKind(kind="app.fetch", label="Fetch", category="import", handler="handlers:fetch", network=True)
    with pytest.raises(nodes.DefinitionError, match="IS_LOCAL=true"):
        nodes.check([fetch], [])
    nodes.check([fetch], [], local=True)
