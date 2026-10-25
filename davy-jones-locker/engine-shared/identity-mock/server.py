"""identity-mock: an OpenID Connect provider for local development only. It
signs in whoever you say you are, so an engine can be run with IDENTITY=oidc
on your own machine without a real provider.

  GET  /.well-known/openid-configuration   the discovery document
  GET  /jwks                               its signing key (RS256, new each start)
  GET  /authorize                          a form: the email, name and groups to sign in as
  POST /authorize                          sends the browser back with a code
  POST /token                              the code (with PKCE) for an ID token
  GET  /logout                             says you're signed out

The browser and the engine reach it at different addresses (PUBLIC_URL on
this machine, INTERNAL_URL on the shared network), so its discovery document
gives the browser's endpoints (authorize, logout) at one and the engine's
(token, keys, and the issuer) at the other. A real provider has one address.

Settings (environment): PUBLIC_URL, INTERNAL_URL, CLIENT_ID, CLIENT_SECRET,
and DEFAULT_EMAIL / DEFAULT_NAME / DEFAULT_GROUPS (the form's starting
values). Codes and the key are kept in memory.
"""

import base64
import hashlib
import hmac
import html
import json
import os
import secrets
import time
from urllib.parse import parse_qs, urlencode

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse

PUBLIC_URL = (os.environ.get("PUBLIC_URL") or "http://localhost:9100").rstrip("/")
INTERNAL_URL = (os.environ.get("INTERNAL_URL") or PUBLIC_URL).rstrip("/")
CLIENT_ID = os.environ.get("CLIENT_ID") or "engine-dev"
CLIENT_SECRET = os.environ.get("CLIENT_SECRET") or "engine-dev-secret"
DEFAULTS = {
    "email": os.environ.get("DEFAULT_EMAIL") or "dev@example.com",
    "name": os.environ.get("DEFAULT_NAME") or "Dev User",
    "groups": os.environ.get("DEFAULT_GROUPS") or "",
}

KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
KID = secrets.token_hex(4)
CODES: dict[str, dict] = {}

app = FastAPI(title="identity-mock")


def b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def as_bytes(n: int) -> bytes:
    return n.to_bytes((n.bit_length() + 7) // 8, "big")


def form(body: bytes) -> dict[str, str]:
    return {k: v[0] for k, v in parse_qs(body.decode()).items()}


def page(title: str, body: str, status: int = 200) -> HTMLResponse:
    return HTMLResponse(
        f"<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width, initial-scale=1'>"
        f"<title>{html.escape(title)}</title><body style='font:15px/1.5 system-ui,sans-serif;max-width:30em;"
        f"margin:3em auto;padding:0 16px'><h1 style='font-size:1.3em'>{html.escape(title)}</h1>{body}",
        status_code=status,
    )


@app.get("/.well-known/openid-configuration")
def discovery():
    return {
        "issuer": INTERNAL_URL,
        "authorization_endpoint": f"{PUBLIC_URL}/authorize",
        "end_session_endpoint": f"{PUBLIC_URL}/logout",
        "token_endpoint": f"{INTERNAL_URL}/token",
        "jwks_uri": f"{INTERNAL_URL}/jwks",
        "response_types_supported": ["code"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["RS256"],
        "code_challenge_methods_supported": ["S256"],
        "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
    }


@app.get("/jwks")
def jwks():
    numbers = KEY.public_key().public_numbers()
    return {"keys": [{"kty": "RSA", "kid": KID, "alg": "RS256", "use": "sig", "n": b64(as_bytes(numbers.n)), "e": b64(as_bytes(numbers.e))}]}


SIGN_IN = ("redirect_uri", "state", "nonce", "code_challenge", "code_challenge_method", "client_id")


@app.get("/authorize")
def authorize(request: Request):
    query = dict(request.query_params)
    if query.get("client_id") != CLIENT_ID:
        return page("Unknown application", f"<p>This provider knows only the client {html.escape(CLIENT_ID)}.</p>", 400)
    if query.get("code_challenge_method") != "S256" or not query.get("redirect_uri", "").startswith(("http://", "https://")):
        return page("Can't sign in", "<p>Sign-in needs PKCE (S256) and an http or https redirect address.</p>", 400)
    e = html.escape
    hidden = "".join(f"<input type=hidden name='{k}' value='{e(query.get(k, ''))}'>" for k in SIGN_IN)
    field = lambda name, label: (
        f"<p><label>{label}<br><input name={name} value='{e(DEFAULTS[name])}' style='width:100%;font:inherit'></label></p>"
    )
    return page(
        "Sign in (identity-mock)",
        "<p>For local development: you're signed in as whoever you say.</p>"
        f"<form method=post>{hidden}{field('email', 'Email')}{field('name', 'Name')}"
        f"{field('groups', 'Groups (comma-separated)')}<p><button style='font:inherit'>Sign in</button></p></form>",
    )


@app.post("/authorize")
async def authorized(request: Request):
    values = form(await request.body())
    if values.get("client_id") != CLIENT_ID or not values.get("redirect_uri", "").startswith(("http://", "https://")):
        return page("Can't sign in", "<p>That sign-in wasn't started here.</p>", 400)
    code = secrets.token_urlsafe(24)
    CODES[code] = {**{k: values.get(k, "") for k in SIGN_IN}, "issued": time.time(), "email": values.get("email", "").strip(),
                   "name": values.get("name", "").strip(), "groups": [g.strip() for g in values.get("groups", "").split(",") if g.strip()]}
    redirect = values["redirect_uri"]
    return RedirectResponse(f"{redirect}{'&' if '?' in redirect else '?'}{urlencode({'code': code, 'state': values.get('state', '')})}", 302)


def refuse(error: str, status: int = 400) -> JSONResponse:
    return JSONResponse({"error": error}, status_code=status)


@app.post("/token")
async def token(request: Request):
    values = form(await request.body())
    client_id, secret = values.get("client_id", ""), values.get("client_secret", "")
    auth = request.headers.get("authorization", "")
    if auth.startswith("Basic "):
        client_id, _, secret = base64.b64decode(auth[6:]).decode().partition(":")
    if client_id != CLIENT_ID or not hmac.compare_digest(secret, CLIENT_SECRET):
        return refuse("invalid_client", 401)
    issued = CODES.pop(values.get("code", ""), None)
    if not issued or time.time() - issued["issued"] > 120 or issued["redirect_uri"] != values.get("redirect_uri"):
        return refuse("invalid_grant")
    if b64(hashlib.sha256(values.get("code_verifier", "").encode()).digest()) != issued["code_challenge"]:
        return refuse("invalid_grant")
    now = int(time.time())
    claims = {
        "iss": INTERNAL_URL, "sub": hashlib.sha256(issued["email"].lower().encode()).hexdigest()[:16], "aud": CLIENT_ID,
        "iat": now, "exp": now + 600, "nonce": issued["nonce"], "email": issued["email"], "email_verified": True,
        "name": issued["name"], "preferred_username": issued["email"], "groups": issued["groups"],
    }
    header = b64(json.dumps({"alg": "RS256", "typ": "JWT", "kid": KID}).encode())
    body = b64(json.dumps(claims).encode())
    signature = KEY.sign(f"{header}.{body}".encode(), padding.PKCS1v15(), hashes.SHA256())
    return {"id_token": f"{header}.{body}.{b64(signature)}", "token_type": "Bearer", "expires_in": 600,
            "access_token": secrets.token_urlsafe(24)}


@app.get("/logout")
def logout():
    return page("Signed out", "<p>You're signed out of identity-mock. Open the app again to sign in.</p>")
