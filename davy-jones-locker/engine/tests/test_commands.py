"""The Terminal's b. commands (commands.py, /commands): settings over .env in
memory, secrets never shown, and the .env key kept to the .env address."""

import pytest
from fastapi.testclient import TestClient

from davy_jones_locker import assist, commands, main, settings


@pytest.fixture(autouse=True)
def env(monkeypatch):
    monkeypatch.setattr(settings, "IS_LOCAL", True)
    monkeypatch.setattr(settings, "DATABASE_URL", "")
    monkeypatch.setattr(settings, "LITELLM_BASE_URL", "https://litellm.example/v1")
    monkeypatch.setattr(settings, "LITELLM_API_KEY", "env-key")
    monkeypatch.setattr(settings, "ASSIST_MODEL", "env-model")
    commands.run("b.Settings.Reset")
    yield
    commands.run("b.Settings.Reset")


@pytest.fixture
def client():
    with TestClient(main.create_app(), headers={"X-Requested-By": "test"}) as client:
        yield client


def run(client, name, **value):
    return client.post("/commands", json={"name": name, **value})


def listed(client) -> dict:
    return {c["name"]: c for c in client.get("/commands").json()["commands"]}


def test_settings_are_listed_with_their_values_and_secrets_hidden(client):
    found = listed(client)
    assert found["b.Assistant.Model"]["value"] == "env-model"
    assert found["b.LiteLLMKey"] == {
        "name": "b.LiteLLMKey", "kind": "setting", "description": found["b.LiteLLMKey"]["description"],
        "type": "string", "secret": True, "set": False, "value": True,
    }
    assert found["b.Settings.Reset"]["kind"] == "action"


def test_a_setting_set_by_command_is_used_and_printed(client):
    assert run(client, "b.assistant.model", value="other").json() == {"message": 'b.Assistant.Model = "other"'}
    assert assist.summary()["model"] == "other"
    assert listed(client)["b.Assistant.Model"]["set"] is True
    assert run(client, "b.Assistant.Model").json()["message"] == 'b.Assistant.Model = "other"'


def test_a_secret_is_never_echoed(client):
    assert run(client, "b.LiteLLMKey", value="typed-key").json()["message"] == "b.LiteLLMKey = ••••"
    assert run(client, "b.LiteLLMKey").json()["message"] == "b.LiteLLMKey = •••• (set)"
    assert "typed-key" not in client.get("/commands").text
    assert commands.litellm_key() == "typed-key"


def test_the_env_key_never_goes_to_an_address_set_by_command(client):
    message = run(client, "b.LiteLLMURL", value="https://elsewhere.example/").json()["message"]
    assert "Set b.LiteLLMKey too" in message
    assert commands.litellm_url() == "https://elsewhere.example"
    assert commands.litellm_key() == ""
    assert assist.enabled() is False
    run(client, "b.LiteLLMKey", value="for-elsewhere")
    assert assist.enabled() is True
    # A new address forgets the key set for the last one.
    run(client, "b.LiteLLMURL", value="https://third.example")
    assert commands.litellm_key() == ""


def test_types_and_names_are_checked(client):
    assert run(client, "b.Assistant.Enabled", value="no").json()["error"] == "b.Assistant.Enabled takes true or false."
    assert run(client, "b.LiteLLMURL", value="file:///etc").json()["error"].startswith("b.LiteLLMURL takes an address")
    assert "no command called b.Nope" in run(client, "b.Nope").json()["error"]
    assert run(client, "b.Settings.Reset", value=1).json()["error"] == "b.Settings.Reset is an action: it takes no value."


def test_turning_the_assistant_off_and_resetting(client):
    run(client, "b.Assistant.Enabled", value=False)
    assert assist.summary() is None
    assert client.post("/assist", json={"kind": "sql-query", "request": "x"}).json()["error"].startswith("The AI assistant is off")
    assert run(client, "b.Settings.Reset").json()["message"] == "Forgot b.Assistant.Enabled: back to the engine's .env."
    assert assist.summary()["model"] == "env-model"


def test_a_command_from_another_site_is_refused(client):
    # A page elsewhere can post to the engine, but not with X-Requested-By.
    response = client.post("/commands", json={"name": "b.Assistant.Model", "value": "x"}, headers={"X-Requested-By": ""})
    assert response.status_code == 403
    assert commands.assist_model() == "env-model"


def test_an_app_adds_its_own(client):
    seen = {}
    extra = commands.Command("App.Region", "setting", "Where.", values=["east", "west"],
                             get=lambda: seen.get("r", "east"), set=lambda v: seen.update(r=v))
    with TestClient(main.create_app(commands=[extra]), headers={"X-Requested-By": "test"}) as app_client:
        assert run(app_client, "b.App.Region", value="north").json()["error"] == "b.App.Region takes one of east, west."
        assert run(app_client, "b.App.Region", value="west").json()["message"] == 'b.App.Region = "west"'
    commands.register([])
