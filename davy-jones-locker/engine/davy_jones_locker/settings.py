"""The engine's settings, from the environment (the app's .env under compose;
see .env.example for what each one means)."""

import os
from urllib.parse import urlsplit


def _int(name: str, default: int) -> int:
    return int(os.environ.get(name) or default)


def _list(name: str) -> list[str]:
    return [item.strip() for item in (os.environ.get(name) or "").split(",") if item.strip()]


# What /health reports as this engine's address.
PUBLIC_HOST = os.environ.get("PUBLIC_HOST") or "engine"
PORT = _int("PORT", 3000)

# Postgres holding the engine's own tables (graphs, stored files, runs), in
# FLOW_SCHEMA. Without it, the endpoints that need them answer 503.
DATABASE_URL = os.environ.get("DATABASE_URL") or ""
FLOW_SCHEMA = os.environ.get("FLOW_SCHEMA") or "flow"

# The database server-side SQL reads, attached read-only as the catalog "db".
# The same Postgres by default; give it a read-only role in production.
QUERY_DATABASE_URL = os.environ.get("QUERY_DATABASE_URL") or DATABASE_URL

# The Python sandbox (sandbox/), usually a service of its own beside the engine.
RUNNER_URL = (os.environ.get("RUNNER_URL") or "http://runner:3000").rstrip("/")

# The node worker (nodeworker/), which runs the app's own node kinds: needed
# only when create_app is given some.
NODE_WORKER_URL = (os.environ.get("NODE_WORKER_URL") or "").rstrip("/")

# Hosts whose requests the engine refuses: the runner's and the node worker's,
# and any others listed in SANDBOX_HOSTS. Scripts run there, so nothing from
# there may use the engine (its database, its saved graphs, its AI budget, or
# the node kinds it runs). Resolved on every request, so replicas and restarts
# are covered. Loopback addresses are never refused (a runner on the same
# machine, in development, shares them with everything else).
SANDBOX_HOSTS = [
    host for host in [urlsplit(RUNNER_URL).hostname, urlsplit(NODE_WORKER_URL).hostname if NODE_WORKER_URL else None]
    if host
] + _list("SANDBOX_HOSTS")

# The AI assistant (POST /assist), through a LiteLLM proxy: off unless the
# URL, key and model are all set (there's no default model: the proxy decides
# which it offers). The key stays here: the browser never sees it.
LITELLM_BASE_URL = (os.environ.get("LITELLM_BASE_URL") or "").rstrip("/")
LITELLM_API_KEY = os.environ.get("LITELLM_API_KEY") or ""
ASSIST_MODEL = os.environ.get("ASSIST_MODEL") or ""
# Rows of each input sent with a request, as examples of its values (0: none).
ASSIST_SAMPLE_ROWS = _int("ASSIST_SAMPLE_ROWS", 3)
ASSIST_TIMEOUT_SECONDS = _int("ASSIST_TIMEOUT_SECONDS", 90)

# Limits.
RUN_TIMEOUT_SECONDS = _int("RUN_TIMEOUT_SECONDS", 60)
QUERY_TIMEOUT_SECONDS = _int("QUERY_TIMEOUT_SECONDS", 60)
QUERY_MEMORY_LIMIT = os.environ.get("QUERY_MEMORY_LIMIT") or "1GB"
MAX_UPLOAD_MB = _int("MAX_UPLOAD_MB", 200)
