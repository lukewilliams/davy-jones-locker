"""Sign-in (identity.py): OIDC against a stand-in provider, trusted headers,
the access rule, the X-Requested-By header, and what's kept per user (b.
settings, jobs)."""

import base64
import hashlib
import json
import time
from urllib.parse import parse_qs, urlsplit

import httpx
import pytest
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from fastapi.testclient import TestClient

from davy_jones_locker import commands, database, identity, main, settings

SECRET = "s" * 40
HEADERS = {"X-Requested-By": "test"}


def b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


@pytest.fixture(autouse=True)
def env(monkeypatch):
    monkeypatch.setattr(settings, "IS_LOCAL", False)
    monkeypatch.setattr(settings, "DATABASE_URL", "")
    monkeypatch.setattr(settings, "ALLOWED_USERS", ["*@example.com", "group:analysts"])
    monkeypatch.setattr(settings, "SECRET_KEY", "k" * 40)
    monkeypatch.setattr(settings, "ASSIST_MODEL", "env-model")
    commands._local.clear()
    commands._saved.clear()
    yield
    commands._local.clear()
    commands._saved.clear()


# ---- The access rule, and where sign-in may return to ----

def test_the_rule_matches_addresses_and_groups():
    rule = ["*@example.com", "someone@other.org", "group:analysts"]
    assert identity.allowed(identity.User("1", "Ann@Example.com"), rule)
    assert identity.allowed(identity.User("2", "someone@other.org"), rule)
    assert identity.allowed(identity.User("3", "x@elsewhere.net", groups=("analysts",)), rule)
    assert not identity.allowed(identity.User("4", "x@elsewhere.net"), rule)
    assert not identity.allowed(identity.User("5", "x@elsewhere.net@example.com"), rule)
    assert not identity.allowed(identity.User("6", "x@sub.example.org"), rule)


def test_sign_in_returns_only_to_the_apps_own_site():
    assert identity.safe_next("/app/?x=1#y") == "/app/?x=1#y"
    for elsewhere in ("//evil.example/", "https://evil.example/", "/\\evil.example", "app", "", None, "/a\nb"):
        assert identity.safe_next(elsewhere) == "/"


def test_settings_must_be_complete_to_start(monkeypatch):
    monkeypatch.setattr(settings, "OIDC_DISCOVERY_URL", "http://idp.example/.well-known/openid-configuration")
    monkeypatch.setattr(settings, "PUBLIC_URL", "https://app.example/engines/engine-app")
    found = " ".join(identity.problems(identity.OIDC()))
    assert "OIDC_CLIENT_ID, OIDC_CLIENT_SECRET" in found
    assert "OIDC_DISCOVERY_URL must start https://" in found
    monkeypatch.setattr(settings, "ALLOWED_USERS", [])
    assert "ALLOWED_USERS" in " ".join(identity.problems(identity.Header()))
    assert "IDENTITY_SECRET" in " ".join(identity.problems(identity.Header()))


def test_a_sealed_value_cant_be_read_under_another_purpose_or_key(monkeypatch):
    sealed = identity.seal("session", {"id": "x"})
    assert identity.unseal("session", sealed) == {"id": "x"}
    assert identity.unseal("settings", sealed) is None
    monkeypatch.setattr(settings, "SECRET_KEY", "j" * 40)
    assert identity.unseal("session", sealed) is None


# ---- Trusted headers ----

@pytest.fixture
def header_engine(monkeypatch):
    monkeypatch.setattr(settings, "IDENTITY", "header")
    monkeypatch.setattr(settings, "IDENTITY_SECRET", SECRET)
    with TestClient(main.create_app()) as client:
        yield client


def as_user(email: str, user: str | None = None, secret: str = SECRET, **more) -> dict:
    return {"X-Forwarded-User": user or email, "X-Forwarded-Email": email, "X-Identity-Secret": secret, **HEADERS, **more}


def test_without_a_user_only_health_and_sign_in_answer(header_engine):
    assert header_engine.get("/health").json() == {"status": "ok", "signIn": "header", "user": None}
    response = header_engine.get("/graphs")
    assert response.status_code == 401
    assert "not signed in" in response.json()["error"]


def test_headers_count_only_with_the_proxys_secret(header_engine):
    assert header_engine.get("/commands", headers=as_user("ann@example.com", secret="w" * 40)).status_code == 401
    health = header_engine.get("/health", headers=as_user("ann@example.com", **{"X-Forwarded-Preferred-Username": "Ann"})).json()
    assert health["user"] == {"email": "ann@example.com", "name": "Ann"}
    assert health["signIn"] == "header"
    assert "nodes" in health


def test_trusted_proxies_are_checked_by_address(monkeypatch):
    monkeypatch.setattr(settings, "IDENTITY", "header")
    monkeypatch.setattr(settings, "IDENTITY_TRUSTED_PROXIES", ["10.0.0.0/8"])
    with TestClient(main.create_app()) as client:  # its requests come from "testclient", no address
        assert client.get("/commands", headers=as_user("ann@example.com", secret="")).status_code == 401


def test_someone_the_rule_doesnt_name_is_refused(header_engine):
    response = header_engine.get("/commands", headers=as_user("bob@elsewhere.net"))
    assert response.status_code == 403
    assert response.json()["error"] == "bob@elsewhere.net isn't allowed to use this engine."
    assert header_engine.get("/commands", headers=as_user("bob@elsewhere.net", **{"X-Forwarded-Groups": "x, analysts"})).status_code == 200


def test_changes_need_the_request_header(header_engine):
    headers = as_user("ann@example.com")
    del headers["X-Requested-By"]
    response = header_engine.post("/commands", json={"name": "b.Assistant.Model"}, headers=headers)
    assert response.status_code == 403
    assert "X-Requested-By" in response.json()["error"]


# ---- What's kept per user ----

@pytest.fixture
def store(monkeypatch):
    saved: dict[str, str] = {}
    monkeypatch.setattr(database, "available", lambda: True)
    monkeypatch.setattr(database, "get_user_settings", saved.get)
    monkeypatch.setattr(database, "put_user_settings", lambda user, sealed: saved.pop(user, None) if sealed is None else saved.__setitem__(user, sealed))
    return saved


def test_settings_set_by_command_are_each_users_own_and_saved_sealed(header_engine, store):
    ann, bob = as_user("ann@example.com", "ann"), as_user("bob@example.com", "bob")
    assert header_engine.post("/commands", json={"name": "b.Assistant.Model", "value": "ann-model"}, headers=ann).status_code == 200
    header_engine.post("/commands", json={"name": "b.LiteLLMKey", "value": "ann-secret"}, headers=ann)
    models = lambda who: {c["name"]: c for c in header_engine.get("/commands", headers=who).json()["commands"]}["b.Assistant.Model"]
    assert models(ann)["value"] == "ann-model"
    assert models(bob)["value"] == "env-model" and models(bob)["set"] is False
    assert list(store) == ["header|ann"]
    assert "ann-secret" not in store["header|ann"] and "ann-model" not in store["header|ann"]
    # As after a restart: read back from the database.
    commands._saved.clear()
    assert models(ann)["value"] == "ann-model"
    header_engine.post("/commands", json={"name": "b.Settings.Reset"}, headers=ann)
    assert store == {}


def test_without_a_database_settings_cant_be_set_when_signed_in(header_engine):
    response = header_engine.post("/commands", json={"name": "b.Assistant.Model", "value": "x"}, headers=as_user("ann@example.com"))
    assert response.status_code == 400
    assert "saved per user in the engine's database" in response.json()["error"]
    assert commands._saved["header|ann@example.com"] == {}


def test_a_job_is_its_starters(header_engine):
    ann, bob = as_user("ann@example.com"), as_user("bob@example.com")
    started = header_engine.post("/jobs", json={"document": {"format": "pipeline", "nodes": [], "edges": []}}, headers=ann)
    job_id = started.json()["id"]
    assert header_engine.get(f"/jobs/{job_id}", headers=ann).status_code == 200
    assert header_engine.get(f"/jobs/{job_id}", headers=bob).status_code == 404
    assert header_engine.delete(f"/jobs/{job_id}", headers=bob).status_code == 404


# ---- OIDC ----

ISSUER = "https://idp.example"


class Provider:
    """A stand-in OIDC provider, answering through httpx's MockTransport."""

    def __init__(self):
        self.key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self.codes: dict[str, dict] = {}
        self.token_requests: list[httpx.Request] = []
        self.sign_with = self.key
        self.claims: dict = {}

    def jwk(self) -> dict:
        numbers = self.key.public_key().public_numbers()
        as_bytes = lambda n: n.to_bytes((n.bit_length() + 7) // 8, "big")
        return {"kty": "RSA", "kid": "k1", "alg": "RS256", "n": b64(as_bytes(numbers.n)), "e": b64(as_bytes(numbers.e))}

    def id_token(self, nonce: str, email: str) -> str:
        header = b64(json.dumps({"alg": "RS256", "kid": "k1"}).encode())
        claims = {
            "iss": ISSUER, "sub": f"sub-{email}", "aud": "engine-client", "exp": time.time() + 300, "nonce": nonce,
            "email": email, "name": email.split("@")[0].title(), "groups": ["analysts", "other"], **self.claims,
        }
        body = b64(json.dumps(claims).encode())
        signature = self.sign_with.sign(f"{header}.{body}".encode(), padding.PKCS1v15(), hashes.SHA256())
        return f"{header}.{body}.{b64(signature)}"

    def handle(self, request: httpx.Request) -> httpx.Response:
        path = request.url.path
        if path == "/.well-known/openid-configuration":
            return httpx.Response(200, json={
                "issuer": ISSUER, "authorization_endpoint": f"{ISSUER}/authorize", "token_endpoint": f"{ISSUER}/token",
                "jwks_uri": f"{ISSUER}/jwks", "end_session_endpoint": f"{ISSUER}/logout",
            })
        if path == "/jwks":
            return httpx.Response(200, json={"keys": [self.jwk()]})
        if path == "/token":
            self.token_requests.append(request)
            form = parse_qs(request.content.decode())
            issued = self.codes.pop(form["code"][0], None)
            verifier = form["code_verifier"][0]
            if not issued or b64(hashlib.sha256(verifier.encode()).digest()) != issued["challenge"]:
                return httpx.Response(400, json={"error": "invalid_grant"})
            return httpx.Response(200, json={"id_token": self.id_token(issued["nonce"], issued["email"])})
        return httpx.Response(404)

    def authorize(self, location: str, email: str) -> str:
        """What the provider does at its authorize endpoint: the callback's query."""
        query = {k: v[0] for k, v in parse_qs(urlsplit(location).query).items()}
        assert query["redirect_uri"] == "https://app.example/auth/callback"
        assert query["code_challenge_method"] == "S256"
        code = f"code-{len(self.codes)}"
        self.codes[code] = {"nonce": query["nonce"], "challenge": query["code_challenge"], "email": email}
        return f"code={code}&state={query['state']}"


@pytest.fixture
def provider():
    return Provider()


@pytest.fixture
def oidc(monkeypatch, provider):
    monkeypatch.setattr(settings, "IDENTITY", "oidc")
    monkeypatch.setattr(settings, "OIDC_DISCOVERY_URL", f"{ISSUER}/.well-known/openid-configuration")
    monkeypatch.setattr(settings, "OIDC_CLIENT_ID", "engine-client")
    monkeypatch.setattr(settings, "OIDC_CLIENT_SECRET", "client-secret")
    monkeypatch.setattr(settings, "PUBLIC_URL", "https://app.example")
    app = main.create_app(identity=identity.OIDC(transport=httpx.MockTransport(provider.handle)))
    with TestClient(app, base_url="https://app.example", headers=HEADERS, follow_redirects=False) as client:
        yield client


def sign_in(client, provider, email="ann@example.com", next="/app/"):
    started = client.get("/auth/login", params={"next": next})
    assert started.status_code == 302
    return client.get(f"/auth/callback?{provider.authorize(started.headers['location'], email)}")


def test_signing_in_sets_a_session_and_returns_to_the_app(oidc, provider):
    assert oidc.get("/commands").status_code == 401
    done = sign_in(oidc, provider)
    assert done.status_code == 302 and done.headers["location"] == "/app/"
    cookie = done.headers["set-cookie"]
    assert "djl_session=" in cookie and "HttpOnly" in cookie and "Secure" in cookie and "samesite=lax" in cookie.lower()
    health = oidc.get("/health").json()
    assert health["user"] == {"email": "ann@example.com", "name": "Ann"} and health["signIn"] == "oidc"
    assert oidc.get("/commands").status_code == 200
    # The secret went in the Authorization header, never in the page.
    assert provider.token_requests[0].headers["authorization"].startswith("Basic ")
    assert "client-secret" not in done.text
    # Only the groups the rule names are kept.
    session = identity.unseal("session", oidc.cookies["djl_session"])
    assert session == {"id": f"{ISSUER}|sub-ann@example.com", "email": "ann@example.com", "name": "Ann", "groups": ["analysts"]}


def test_signing_out_forgets_the_session_and_signs_out_at_the_provider(oidc, provider):
    sign_in(oidc, provider)
    out = oidc.get("/auth/logout")
    assert out.headers["location"] == f"{ISSUER}/logout?client_id=engine-client"
    assert oidc.get("/commands").status_code == 401


def test_someone_the_rule_doesnt_name_gets_no_session(oidc, provider):
    provider.claims = {"groups": ["other"]}
    refused = sign_in(oidc, provider, email="bob@elsewhere.net")
    assert refused.status_code == 403
    assert "bob@elsewhere.net isn&#x27;t allowed" in refused.text
    assert "djl_session" not in oidc.cookies


def test_a_token_signed_by_anyone_else_is_refused(oidc, provider):
    provider.sign_with = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    refused = sign_in(oidc, provider)
    assert refused.status_code == 400 and "signature is wrong" in refused.text
    assert "djl_session" not in oidc.cookies


@pytest.mark.parametrize("claims, says", [
    ({"iss": "https://other.example"}, "another issuer"),
    ({"aud": "someone-else"}, "another application"),
    ({"exp": time.time() - 3600}, "expired"),
    ({"nonce": "replayed"}, "another sign-in"),
    ({"email_verified": False}, "isn&#x27;t verified"),
])
def test_the_id_tokens_claims_are_checked(oidc, provider, claims, says):
    provider.claims = claims
    refused = sign_in(oidc, provider)
    assert refused.status_code == 400 and says in refused.text


def test_a_callback_without_its_sign_in_is_refused(oidc, provider):
    started = oidc.get("/auth/login")
    query = provider.authorize(started.headers["location"], "ann@example.com")
    oidc.cookies.clear()
    refused = oidc.get(f"/auth/callback?{query}")
    assert refused.status_code == 400 and "started more than 10 minutes ago" in refused.text


def test_sign_in_never_returns_to_another_site(oidc, provider):
    assert sign_in(oidc, provider, next="//evil.example/").headers["location"] == "/"


def test_es256_tokens_are_checked_too(monkeypatch):
    import asyncio

    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature

    monkeypatch.setattr(settings, "OIDC_CLIENT_ID", "engine-client")
    monkeypatch.setattr(settings, "OIDC_DISCOVERY_URL", f"{ISSUER}/.well-known/openid-configuration")
    key = ec.generate_private_key(ec.SECP256R1())
    numbers = key.public_key().public_numbers()
    jwk = {"kty": "EC", "crv": "P-256", "kid": "e1", "x": b64(numbers.x.to_bytes(32, "big")), "y": b64(numbers.y.to_bytes(32, "big"))}

    def answer(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/jwks":
            return httpx.Response(200, json={"keys": [jwk]})
        return httpx.Response(200, json={
            "issuer": ISSUER, "authorization_endpoint": f"{ISSUER}/a", "token_endpoint": f"{ISSUER}/t", "jwks_uri": f"{ISSUER}/jwks",
        })

    def token(signer) -> str:
        header = b64(json.dumps({"alg": "ES256", "kid": "e1"}).encode())
        body = b64(json.dumps({"iss": ISSUER, "sub": "s", "aud": "engine-client", "exp": time.time() + 60, "nonce": "n"}).encode())
        r, s = decode_dss_signature(signer.sign(f"{header}.{body}".encode(), ec.ECDSA(hashes.SHA256())))
        return f"{header}.{body}.{b64(r.to_bytes(32, 'big') + s.to_bytes(32, 'big'))}"

    oidc = identity.OIDC(transport=httpx.MockTransport(answer))
    assert asyncio.run(oidc.verify(token(key), "n"))["sub"] == "s"
    with pytest.raises(identity.IdentityError, match="signature is wrong"):
        asyncio.run(oidc.verify(token(ec.generate_private_key(ec.SECP256R1())), "n"))
