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


@pytest.mark.parametrize("host,allowed", [
    ("localhost:9130", True), ("127.0.0.1:8130", True), ("[::1]:9130", True), ("kraken.localhost:5130", True),
    ("engine-kraken:3000", True), ("ENGINE-KRAKEN", True), ("app.example", True),
    ("rebind.attacker.example:9130", False), ("localhost.attacker.example", False), ("192.168.1.20:8130", False),
    ("", False),
])
def test_an_engine_that_signs_no_one_in_answers_only_this_machines_names(monkeypatch, host, allowed):
    """DNS rebinding: a page points its own name at 127.0.0.1 and calls the
    engine as its own origin. The Host header gives it away."""
    from fastapi.testclient import TestClient

    monkeypatch.setattr(settings, "IS_LOCAL", True)
    monkeypatch.setattr(settings, "IDENTITY", "")
    monkeypatch.setattr(settings, "DATABASE_URL", "")
    monkeypatch.setattr(settings, "PUBLIC_HOST", "engine-kraken")
    monkeypatch.setattr(settings, "LOCAL_ALLOWED_HOSTS", ["app.example"])
    with TestClient(main.create_app(), headers={"X-Requested-By": "test"}) as client:
        response = client.get("/health", headers={"Host": host})
        assert (response.status_code == 200) is allowed
        if not allowed:
            assert response.status_code == 403 and "localhost" in response.json()["error"]


def test_with_sign_in_the_host_check_is_off(monkeypatch):
    """Signed-in engines are reached by name from anywhere: their cookies,
    bound to the real name, are what protects them."""
    from fastapi.testclient import TestClient

    monkeypatch.setattr(settings, "IS_LOCAL", True)
    monkeypatch.setattr(settings, "IDENTITY", "header")
    monkeypatch.setattr(settings, "IDENTITY_SECRET", "s" * 32)
    monkeypatch.setattr(settings, "ALLOWED_USERS", ["*@example.org"])
    monkeypatch.setattr(settings, "DATABASE_URL", "")
    with TestClient(main.create_app()) as client:
        assert client.get("/health", headers={"Host": "engine.example.org"}).status_code == 200
