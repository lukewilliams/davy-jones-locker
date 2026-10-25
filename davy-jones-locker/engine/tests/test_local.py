"""IS_LOCAL: without it the engine starts only with sign-in, and with it it
says it's for local development."""

import asyncio

import pytest
from fastapi import FastAPI

from davy_jones_locker import identity, main, settings


async def start(app: FastAPI) -> None:
    async with main.lifespan(app):
        pass


def test_without_is_local_or_sign_in_the_engine_refuses_to_start(monkeypatch):
    monkeypatch.setattr(settings, "IS_LOCAL", False)
    monkeypatch.setattr(settings, "IDENTITY", "")
    monkeypatch.setattr(main, "provider", identity.configure())
    with pytest.raises(RuntimeError, match="requires sign-in"):
        asyncio.run(start(FastAPI()))


def test_signing_no_one_in_is_for_local_development_only(monkeypatch):
    monkeypatch.setattr(settings, "IS_LOCAL", False)
    monkeypatch.setattr(settings, "IDENTITY", "none")
    monkeypatch.setattr(main, "provider", identity.configure())
    with pytest.raises(RuntimeError, match="local development only"):
        asyncio.run(start(FastAPI()))


def test_local_engine_starts_warns_and_says_so(monkeypatch, caplog):
    monkeypatch.setattr(settings, "IS_LOCAL", True)
    monkeypatch.setattr(settings, "IDENTITY", "")
    monkeypatch.setattr(settings, "DATABASE_URL", "")
    monkeypatch.setattr(main, "provider", identity.configure())
    asyncio.run(start(FastAPI()))
    assert "node kinds can reach the network" in caplog.text
    assert main.health()["local"] is True


def test_a_kind_may_ask_for_the_network_only_when_local():
    from davy_jones_locker import nodes

    fetch = nodes.NodeKind(kind="app.fetch", label="Fetch", category="import", handler="handlers:fetch", network=True)
    with pytest.raises(nodes.DefinitionError, match="IS_LOCAL=true"):
        nodes.check([fetch], [])
    nodes.check([fetch], [], local=True)
