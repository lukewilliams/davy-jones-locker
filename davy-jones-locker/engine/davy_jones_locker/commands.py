"""The Terminal's b. commands (roadmap 8f): settings and actions the browser's
Terminal runs on the engine. GET /commands lists them for completion, and
POST /commands runs one (main.py).

A setting set by command is kept in this process's memory, over what .env
says, for everyone using the engine until it restarts (the browser sends it
again then: see the app shell's commands.js). There's no sign-in yet, so
commands are accepted only in local development (IS_LOCAL). Values are never
logged, and a secret's never leaves the engine.

The LiteLLM key in .env goes only to the LiteLLM address in .env: once
b.LiteLLMURL is set by command, the assistant has no key until b.LiteLLMKey
is set too, so the .env key can't be sent to an address someone typed.

An app adds its own commands with create_app(commands=[...]).
"""

import json
import re
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from . import settings

NAME = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$")
TYPES = {"string": str, "number": (int, float), "boolean": bool}


class CommandError(ValueError):
    """A command that can't run as asked, its message meant for the user."""


@dataclass
class Command:
    """A b. command. `name` is without the b. (`LiteLLMURL`, `Assistant.Model`).
    A setting has `get()` and `set(value)`, which returns what to print (or
    None) or raises CommandError; an action has `run()`, the same."""

    name: str
    kind: str  # 'setting' or 'action'
    description: str
    type: str = "string"
    secret: bool = False
    values: list[str] | None = None
    get: Callable[[], Any] | None = None
    set: Callable[[Any], str | None] | None = None
    run: Callable[[], str | None] | None = None
    overridden: Callable[[], bool] = field(default=lambda: False)

    def describe(self) -> dict:
        about = {
            "name": f"b.{self.name}", "kind": self.kind, "description": self.description,
            "type": self.type, "secret": self.secret, "set": self.overridden(),
        }
        if self.values:
            about["values"] = self.values
        if self.kind == "setting":
            value = self.get()
            about["value"] = bool(value) if self.secret else value
        return about


# Settings set by command, by name.
_overrides: dict[str, Any] = {}


def _override(name: str):
    return lambda: name in _overrides


# ---- What the assistant uses (assist.py reads these, not settings) ----


def litellm_url() -> str:
    return _overrides.get("LiteLLMURL", settings.LITELLM_BASE_URL)


def litellm_key() -> str:
    if "LiteLLMKey" in _overrides:
        return _overrides["LiteLLMKey"]
    # .env's key goes only to .env's address.
    return "" if "LiteLLMURL" in _overrides else settings.LITELLM_API_KEY


def assist_model() -> str:
    return _overrides.get("Assistant.Model", settings.ASSIST_MODEL)


def assistant_on() -> bool:
    return _overrides.get("Assistant.Enabled", True)


def _set(name: str, message: Callable[[Any], str] | None = None):
    def set_value(value):
        _overrides[name] = value
        return message(value) if message else None
    return set_value


def _set_url(value: str) -> str:
    url = value.strip().rstrip("/")
    if not re.match(r"^https?://[^\s/]+", url):
        raise CommandError("b.LiteLLMURL takes an address starting http:// or https://.")
    _overrides["LiteLLMURL"] = url
    _overrides.pop("LiteLLMKey", None)
    return (
        f"The assistant now uses {url}. Set b.LiteLLMKey too: the key in the engine's .env goes only to the "
        "address there."
    )


def _reset() -> str:
    names = sorted(_overrides)
    _overrides.clear()
    return f"Forgot {', '.join('b.' + n for n in names)}: back to the engine's .env." if names else "Nothing was set by command."


BUILT_IN = [
    Command(
        "LiteLLMURL", "setting", "The LiteLLM server the AI assistant uses, over the engine's .env.",
        get=litellm_url, set=_set_url, overridden=_override("LiteLLMURL"),
    ),
    Command(
        "LiteLLMKey", "setting", "The key for the LiteLLM server, over the engine's .env.", secret=True,
        get=litellm_key, set=_set("LiteLLMKey"), overridden=_override("LiteLLMKey"),
    ),
    Command(
        "Assistant.Model", "setting", "The model the AI assistant asks, over the engine's .env.",
        get=assist_model, set=_set("Assistant.Model"), overridden=_override("Assistant.Model"),
    ),
    Command(
        "Assistant.Enabled", "setting", "Whether the AI assistant is on, for everyone using this engine.", type="boolean",
        get=assistant_on, overridden=_override("Assistant.Enabled"),
        set=_set("Assistant.Enabled", lambda on: "The assistant is on." if on else "The assistant is off for everyone using this engine."),
    ),
    Command("Settings.Reset", "action", "Forget every setting set by command: back to the engine's .env.", run=_reset),
]

_commands: dict[str, Command] = {}


def register(extra: list[Command]) -> None:
    """The built-in commands and an app's own (create_app's `commands`)."""
    _commands.clear()
    for command in [*BUILT_IN, *extra]:
        if not NAME.match(command.name) or command.kind not in ("setting", "action"):
            raise ValueError(f"Command {command.name!r} needs a dotted name and kind 'setting' or 'action'.")
        if command.type not in TYPES:
            raise ValueError(f"Command {command.name} has type {command.type!r}: use string, number or boolean.")
        if command.name.lower() in _commands:
            raise ValueError(f"There are two commands called b.{command.name}.")
        _commands[command.name.lower()] = command


register([])


def describe() -> list[dict]:
    return [c.describe() for c in sorted(_commands.values(), key=lambda c: c.name)]


def run(name: str, value: Any = None, has_value: bool = False) -> str:
    """Run `b.<name>` (the b. optional), setting it to `value` when
    `has_value`, or printing it. Returns what to print."""
    key = name.removeprefix("b.").removeprefix("B.").lower()
    command = _commands.get(key)
    if command is None:
        raise CommandError(f"The engine has no command called {name}. f.Help lists them.")
    full = f"b.{command.name}"
    if command.kind == "action":
        if has_value:
            raise CommandError(f"{full} is an action: it takes no value.")
        return command.run() or "Done."
    if not has_value:
        current = command.get()
        if command.secret:
            return f"{full} = •••• (set)" if current else f"{full} = (not set)"
        return f"{full} = {json.dumps(current)}" if current not in (None, "") else f"{full} = (not set)"
    wanted = TYPES[command.type]
    if not isinstance(value, wanted) or (command.type == "number" and isinstance(value, bool)):
        raise CommandError(f"{full} takes {'quoted text' if command.type == 'string' else 'a number' if command.type == 'number' else 'true or false'}.")
    if command.values and value not in command.values:
        raise CommandError(f"{full} takes one of {', '.join(command.values)}.")
    return command.set(value) or (f"{full} = ••••" if command.secret else f"{full} = {json.dumps(value)}")
