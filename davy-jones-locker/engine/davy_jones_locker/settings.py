"""The engine's settings, from the environment (the app's .env under compose;
see .env.example for what each one means)."""

import os
from urllib.parse import urlsplit


def _int(name: str, default: int) -> int:
    return int(os.environ.get(name) or default)


def _list(name: str) -> list[str]:
    return [item.strip() for item in (os.environ.get(name) or "").split(",") if item.strip()]


# Local development (IS_LOCAL=true): the engine may sign no one in
# (IDENTITY=none, its default here), its sign-in provider may be reached over
# plain http, and the app's node kinds can reach the network (the app's compose
# file opens the node worker's way out from the same setting). Anything else
# means a deployment, which requires sign-in (identity.py).
IS_LOCAL = (os.environ.get("IS_LOCAL") or "").strip().lower() == "true"

# Sign-in (identity.py): `none` (local development only, the default there),
# `oidc` or `header`. An app can pass its own provider to create_app instead.
IDENTITY = (os.environ.get("IDENTITY") or "").strip().lower()
# Who may use the engine: email patterns (`*@example.com`, or one address) and
# groups (`group:<id>`), comma-separated. Required with sign-in.
ALLOWED_USERS = _list("ALLOWED_USERS")
# Where browsers reach the engine, with its path (an app's origin plus
# /engines/<service>): sign-in's callback address, and the path its cookies
# are kept to. Required for oidc.
PUBLIC_URL = (os.environ.get("PUBLIC_URL") or "").rstrip("/")
# Encrypts the session cookie and each user's saved settings: at least 32
# characters, random. Changing it signs everyone out and loses saved settings.
SECRET_KEY = os.environ.get("SECRET_KEY") or ""
SESSION_HOURS = _int("SESSION_HOURS", 8)

# OIDC: the provider's discovery document, and this engine's client there
# (registered with PUBLIC_URL/auth/callback as its redirect address).
OIDC_DISCOVERY_URL = os.environ.get("OIDC_DISCOVERY_URL") or ""
OIDC_CLIENT_ID = os.environ.get("OIDC_CLIENT_ID") or ""
OIDC_CLIENT_SECRET = os.environ.get("OIDC_CLIENT_SECRET") or ""
OIDC_SCOPES = os.environ.get("OIDC_SCOPES") or "openid email profile"
# The claim holding the address ALLOWED_USERS matches (empty: `email`, then
# `preferred_username`), and the one holding groups.
OIDC_EMAIL_CLAIM = os.environ.get("OIDC_EMAIL_CLAIM") or ""
OIDC_GROUPS_CLAIM = os.environ.get("OIDC_GROUPS_CLAIM") or "groups"

# Trusted headers: a proxy in front signs users in and says who they are in
# these headers. Trusted only from requests carrying IDENTITY_SECRET (in
# IDENTITY_SECRET_HEADER), or from IDENTITY_TRUSTED_PROXIES (addresses or
# networks), or both: at least one is required.
IDENTITY_HEADER_USER = os.environ.get("IDENTITY_HEADER_USER") or "X-Forwarded-User"
IDENTITY_HEADER_EMAIL = os.environ.get("IDENTITY_HEADER_EMAIL") or "X-Forwarded-Email"
IDENTITY_HEADER_NAME = os.environ.get("IDENTITY_HEADER_NAME") or "X-Forwarded-Preferred-Username"
IDENTITY_HEADER_GROUPS = os.environ.get("IDENTITY_HEADER_GROUPS") or "X-Forwarded-Groups"
IDENTITY_SECRET = os.environ.get("IDENTITY_SECRET") or ""
IDENTITY_SECRET_HEADER = os.environ.get("IDENTITY_SECRET_HEADER") or "X-Identity-Secret"
IDENTITY_TRUSTED_PROXIES = _list("IDENTITY_TRUSTED_PROXIES")
# Where signing out sends the browser (the proxy's own sign-out), if anywhere.
IDENTITY_LOGOUT_URL = os.environ.get("IDENTITY_LOGOUT_URL") or ""

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
# The runner's requirements.in, which the assistant reads to know what scripts
# can import: an app whose runner adds libraries copies its own into the
# engine's image and names it here. Empty: the framework's.
RUNNER_PACKAGES_FILE = os.environ.get("RUNNER_PACKAGES_FILE") or ""

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

# Loops and jobs (roadmap 10d): the most runs of one Loop at once, whatever
# its node asks for; the most jobs running at once (more are refused, 429);
# and how long a finished job's result is kept for collecting.
LOOP_MAX_CONCURRENCY = _int("LOOP_MAX_CONCURRENCY", 4)
JOBS_AT_ONCE = _int("JOBS_AT_ONCE", 4)
JOB_KEEP_SECONDS = _int("JOB_KEEP_SECONDS", 3600)
