"""Sign-in (roadmap 8b part b): who's asking, through a provider the app
chooses, and whether they may use the engine. IDENTITY in .env picks one:

  none     local development only (IS_LOCAL=true, where it's the default):
           everyone is the same local user, and nothing is checked
  oidc     OpenID Connect: authorisation code with PKCE, the engine a
           confidential client. The browser gets an httpOnly session cookie
           (encrypted, SECRET_KEY); tokens never reach the page
  header   a proxy in front signs users in and says who they are in headers,
           trusted only with its secret (IDENTITY_SECRET) or from its
           addresses (IDENTITY_TRUSTED_PROXIES)

An app can write its own: a subclass of Identity, passed to
create_app(identity=...).

A user is a stable ID (the issuer and subject, never the email), with email,
name and groups. ALLOWED_USERS decides who may use the engine, checked on
every request whatever the provider (main.py). Requests that change things
also need the X-Requested-By header: a page on another site can't send it
without the engine's agreement, which it never gives (there's no CORS), so a
site the user visits can't act for them.
"""

import base64
import contextvars
import fnmatch
import hashlib
import hmac
import html
import ipaddress
import json
import logging
import secrets
import time
from dataclasses import dataclass
from urllib.parse import quote, urlencode, urlsplit

import httpx
from cryptography.exceptions import InvalidSignature
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec, padding, rsa
from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature
from fastapi import Request
from fastapi.responses import HTMLResponse, RedirectResponse, Response

from . import settings

log = logging.getLogger("davy-jones-locker.identity")

# Requests that change things carry it (any value): the app shell sends it.
REQUEST_HEADER = "X-Requested-By"
SESSION_COOKIE = "djl_session"
LOGIN_COOKIE = "djl_login"
LOGIN_SECONDS = 600


class IdentityError(ValueError):
    """A sign-in that failed, its message meant for the user."""


@dataclass(frozen=True)
class User:
    """`id` is stable (issuer and subject): per-user things are kept by it."""

    id: str
    email: str = ""
    name: str = ""
    groups: tuple[str, ...] = ()

    def describe(self) -> dict:
        return {"email": self.email, "name": self.name}


LOCAL_USER = User(id="local", name="Local development")

# Who the request being handled is from (main.py's middleware sets it).
current_user: contextvars.ContextVar[User | None] = contextvars.ContextVar("user", default=None)


def signed_in() -> User | None:
    """The request's user, unless the engine signs no one in."""
    user = current_user.get()
    return None if user is None or user.id == LOCAL_USER.id else user


# ---- Who may use the engine ----

def allowed(user: User, rule: list[str] | None = None) -> bool:
    """Whether ALLOWED_USERS (or `rule`) lets `user` in: an email pattern
    (`*@example.com`, or one address; case doesn't matter) matching their
    address, or `group:<id>` naming one of their groups."""
    rule = settings.ALLOWED_USERS if rule is None else rule
    email = user.email.strip().lower()
    # One @ and no spaces, so `*@example.com` can't match `x@other.org@example.com`.
    usable = email.count("@") == 1 and not any(c.isspace() for c in email)
    for entry in rule:
        if entry.lower().startswith("group:"):
            if entry[6:] in user.groups:
                return True
        elif usable and fnmatch.fnmatchcase(email, entry.lower()):
            return True
    return False


def named_groups() -> set[str]:
    return {e[6:] for e in settings.ALLOWED_USERS if e.lower().startswith("group:")}


# ---- Sealed values: the session cookie, a sign-in under way, saved settings ----

def _fernet(purpose: str) -> Fernet:
    digest = hmac.new(settings.SECRET_KEY.encode(), purpose.encode(), hashlib.sha256).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def seal(purpose: str, data) -> str:
    """`data` as JSON, encrypted and signed with a key from SECRET_KEY for
    `purpose` (each purpose its own key, so one can't stand in for another)."""
    return _fernet(purpose).encrypt(json.dumps(data).encode()).decode()


def unseal(purpose: str, token: str, max_age: int | None = None):
    """What seal() sealed, or None when it's been changed, is older than
    `max_age` seconds, or was sealed under another key."""
    if not token or not settings.SECRET_KEY:
        return None
    try:
        return json.loads(_fernet(purpose).decrypt(token.encode(), ttl=max_age))
    except (InvalidToken, ValueError):
        return None


def cookie_path() -> str:
    return urlsplit(settings.PUBLIC_URL).path or "/"


def set_cookie(response: Response, name: str, value: str, max_age: int, path: str) -> None:
    response.set_cookie(
        name, value, max_age=max_age, path=path, httponly=True,
        secure=settings.PUBLIC_URL.startswith("https://"), samesite="lax",
    )


def safe_next(next: str | None) -> str:
    """Where to go after signing in: a path on the app's own site, never
    another site (`//other.example`, `https://...`)."""
    if not next or not next.startswith("/") or next.startswith(("//", "/\\")):
        return "/"
    if any(ord(c) < 32 for c in next):
        return "/"
    return next


def page(title: str, message: str, status: int = 200, link: tuple[str, str] | None = None) -> HTMLResponse:
    """A small page for a browser that came here to sign in or out."""
    e = html.escape
    more = f'<p><a href="{e(link[1])}">{e(link[0])}</a></p>' if link else ""
    return HTMLResponse(
        "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width, initial-scale=1'>"
        f"<title>{e(title)}</title><body style='font:15px/1.5 system-ui,sans-serif;max-width:34em;margin:3em auto;"
        f"padding:0 16px'><h1 style='font-size:1.3em'>{e(title)}</h1><p>{e(message)}</p>{more}",
        status_code=status,
    )


def sign_in_again(next: str) -> tuple[str, str]:
    # Relative to /auth/..., so it works whatever path the engine is behind.
    return ("Sign in again", f"login?{urlencode({'next': next})}")


def _address(text: str):
    try:
        address = ipaddress.ip_address(text.split("%", 1)[0])
    except ValueError:
        return None
    return getattr(address, "ipv4_mapped", None) or address


# ---- Providers ----

class Identity:
    """A sign-in provider. `authenticate` says who a request is from (None:
    no one); `login` starts signing in, then returns the browser to `next`
    (a path on the app's site); `callback` finishes signing in, for providers
    that need one; `logout` signs out. `check` says what's wrong with its
    settings, at startup; `name` is what /health reports."""

    name = "custom"

    def check(self) -> list[str]:
        return []

    def authenticate(self, request: Request) -> User | None:
        raise NotImplementedError

    async def login(self, request: Request, next: str) -> Response:
        raise NotImplementedError

    async def callback(self, request: Request) -> Response:
        return page("Nothing to finish", "This engine's sign-in has no callback.", 404)

    async def logout(self, request: Request) -> Response:
        raise NotImplementedError


class NoIdentity(Identity):
    """Local development: everyone is the local user."""

    name = "none"

    def authenticate(self, request: Request) -> User:
        return LOCAL_USER

    async def login(self, request: Request, next: str) -> Response:
        return RedirectResponse(next, 302)

    async def logout(self, request: Request) -> Response:
        return page("Nothing to sign out of", "This engine signs no one in: it's for local development.")


class Missing(Identity):
    """IDENTITY unset (or unknown) on an engine that needs one: it won't start."""

    name = "missing"

    def check(self) -> list[str]:
        if settings.IDENTITY:
            return [f"IDENTITY={settings.IDENTITY} isn't a sign-in provider: use oidc or header (or none, for local development)."]
        return [
            "IS_LOCAL isn't true, so this engine counts as deployed, and a deployed engine requires sign-in: set "
            "IDENTITY (oidc or header) and its settings in the engine's .env. For local development, set IS_LOCAL=true."
        ]

    def authenticate(self, request: Request) -> None:
        return None


def _b64decode(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _int(text: str) -> int:
    return int.from_bytes(_b64decode(text), "big")


class OIDC(Identity):
    """OpenID Connect, as a confidential client: authorisation code with
    PKCE, a state and a nonce; the ID token's signature checked against the
    provider's published keys (RS256 or ES256), then its issuer, audience,
    expiry and nonce. `transport` replaces httpx's, for tests."""

    name = "oidc"
    ALGORITHMS = {"RS256": "RSA", "ES256": "EC"}

    def __init__(self, transport: httpx.AsyncBaseTransport | None = None):
        self._transport = transport
        self._config: dict | None = None
        self._keys: list[dict] = []

    def check(self) -> list[str]:
        needed = ("OIDC_DISCOVERY_URL", "OIDC_CLIENT_ID", "OIDC_CLIENT_SECRET", "PUBLIC_URL", "SECRET_KEY")
        missing = [name for name in needed if not getattr(settings, name)]
        problems = [f"IDENTITY=oidc needs {', '.join(missing)} in the engine's .env."] if missing else []
        if settings.SECRET_KEY and len(settings.SECRET_KEY) < 32:
            problems.append("SECRET_KEY must be at least 32 characters, and random.")
        if not settings.IS_LOCAL:
            for name in ("OIDC_DISCOVERY_URL", "PUBLIC_URL"):
                value = getattr(settings, name)
                if value and not value.startswith("https://"):
                    problems.append(f"{name} must start https:// (plain http only in local development, IS_LOCAL=true).")
        return problems

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(transport=self._transport, timeout=10)

    async def _get_json(self, url: str, what: str) -> dict:
        try:
            async with self._client() as client:
                response = await client.get(url, headers={"Accept": "application/json"})
            response.raise_for_status()
            return response.json()
        except (httpx.HTTPError, ValueError) as e:
            log.warning("Couldn't read the sign-in provider's %s (%s): %s", what, url, e)
            raise IdentityError(f"The sign-in provider's {what} couldn't be read. Try again in a moment.") from None

    async def config(self) -> dict:
        if self._config is None:
            doc = await self._get_json(settings.OIDC_DISCOVERY_URL, "discovery document")
            needed = ("issuer", "authorization_endpoint", "token_endpoint", "jwks_uri")
            if any(not isinstance(doc.get(k), str) for k in needed):
                raise IdentityError("The sign-in provider's discovery document is missing its endpoints.")
            if not settings.IS_LOCAL and any(not doc[k].startswith("https://") for k in needed[1:]):
                raise IdentityError("The sign-in provider's endpoints must be https.")
            self._config = doc
        return self._config

    def redirect_uri(self) -> str:
        return f"{settings.PUBLIC_URL}/auth/callback"

    def authenticate(self, request: Request) -> User | None:
        data = unseal("session", request.cookies.get(SESSION_COOKIE, ""), settings.SESSION_HOURS * 3600)
        if not isinstance(data, dict) or not data.get("id"):
            return None
        return User(id=data["id"], email=data.get("email", ""), name=data.get("name", ""), groups=tuple(data.get("groups", ())))

    async def login(self, request: Request, next: str) -> Response:
        try:
            config = await self.config()
        except IdentityError as e:
            return page("Can't sign in", str(e), 503, sign_in_again(next))
        state, nonce, verifier = (secrets.token_urlsafe(32) for _ in range(3))
        params = {
            "response_type": "code", "client_id": settings.OIDC_CLIENT_ID, "redirect_uri": self.redirect_uri(),
            "scope": settings.OIDC_SCOPES, "state": state, "nonce": nonce,
            "code_challenge": _b64encode(hashlib.sha256(verifier.encode()).digest()), "code_challenge_method": "S256",
        }
        endpoint = config["authorization_endpoint"]
        response = RedirectResponse(f"{endpoint}{'&' if '?' in endpoint else '?'}{urlencode(params)}", 302)
        sealed = seal("login", {"state": state, "nonce": nonce, "verifier": verifier, "next": next})
        set_cookie(response, LOGIN_COOKIE, sealed, LOGIN_SECONDS, f"{cookie_path().rstrip('/')}/auth")
        return response

    async def callback(self, request: Request) -> Response:
        saved = unseal("login", request.cookies.get(LOGIN_COOKIE, ""), LOGIN_SECONDS)
        next = safe_next(saved.get("next")) if isinstance(saved, dict) else "/"
        query = request.query_params
        if query.get("error"):
            reason = query.get("error_description") or query["error"]
            return page("Sign-in didn't work", f"The sign-in provider said: {reason}", 400, sign_in_again(next))
        if not isinstance(saved, dict) or not hmac.compare_digest(query.get("state", ""), saved.get("state", "")):
            return page(
                "Sign-in didn't finish",
                "This sign-in started more than 10 minutes ago, or in another browser or tab. Try again.",
                400, sign_in_again(next),
            )
        try:
            claims = await self.verify(await self.exchange(query.get("code", ""), saved["verifier"]), saved["nonce"])
            user = self.user(claims)
        except IdentityError as e:
            return page("Sign-in didn't work", str(e), 400, sign_in_again(next))
        if not allowed(user):
            log.warning("Refused a sign-in: %s isn't in ALLOWED_USERS.", user.email or user.id)
            return page(
                "Not allowed", f"{user.email or 'This account'} isn't allowed to use this engine.", 403,
                ("Sign out, to sign in with another account", "logout"),
            )
        log.info("Signed in: %s", user.email or user.id)
        response = RedirectResponse(next, 302)
        session = {"id": user.id, "email": user.email, "name": user.name, "groups": list(user.groups)}
        set_cookie(response, SESSION_COOKIE, seal("session", session), settings.SESSION_HOURS * 3600, cookie_path())
        response.delete_cookie(LOGIN_COOKIE, path=f"{cookie_path().rstrip('/')}/auth")
        return response

    async def exchange(self, code: str, verifier: str) -> str:
        """The authorisation code for an ID token, at the token endpoint."""
        config = await self.config()
        data = {
            "grant_type": "authorization_code", "code": code, "redirect_uri": self.redirect_uri(),
            "code_verifier": verifier,
        }
        # Basic authentication unless the provider says it only takes the
        # secret in the form (the spec's default is basic).
        methods = config.get("token_endpoint_auth_methods_supported") or ["client_secret_basic"]
        auth = None
        if "client_secret_basic" in methods:
            auth = (quote(settings.OIDC_CLIENT_ID, safe=""), quote(settings.OIDC_CLIENT_SECRET, safe=""))
        else:
            data |= {"client_id": settings.OIDC_CLIENT_ID, "client_secret": settings.OIDC_CLIENT_SECRET}
        try:
            async with self._client() as client:
                response = await client.post(config["token_endpoint"], data=data, auth=auth, headers={"Accept": "application/json"})
            body = response.json()
        except (httpx.HTTPError, ValueError) as e:
            log.warning("The sign-in provider's token endpoint couldn't be reached: %s", e)
            raise IdentityError("The sign-in provider couldn't be reached to finish signing in. Try again.") from None
        if response.status_code != 200 or not isinstance(body.get("id_token"), str):
            # Its error code only: never the request, which holds the secret.
            log.warning("The sign-in provider refused the code: %s %s", response.status_code, body.get("error"))
            raise IdentityError("The sign-in provider didn't accept this sign-in. Try again.")
        return body["id_token"]

    async def _key(self, kid: str | None, kty: str):
        for fetch in (not self._keys, True):
            if fetch:
                jwks = await self._get_json((await self.config())["jwks_uri"], "signing keys")
                self._keys = [k for k in jwks.get("keys", []) if isinstance(k, dict)]
            found = [k for k in self._keys if k.get("kty") == kty and (kid is None or k.get("kid") == kid)]
            if len(found) == 1:
                return self._public_key(found[0])
            if fetch:
                break
        raise IdentityError("The sign-in provider signed this sign-in with a key it doesn't publish.")

    @staticmethod
    def _public_key(jwk: dict):
        try:
            if jwk["kty"] == "RSA":
                return rsa.RSAPublicNumbers(_int(jwk["e"]), _int(jwk["n"])).public_key()
            if jwk.get("crv") != "P-256":
                raise ValueError(jwk.get("crv"))
            return ec.EllipticCurvePublicNumbers(_int(jwk["x"]), _int(jwk["y"]), ec.SECP256R1()).public_key()
        except (KeyError, ValueError, TypeError):
            raise IdentityError("The sign-in provider publishes a signing key the engine can't read.") from None

    async def verify(self, token: str, nonce: str) -> dict:
        """The ID token's claims, once its signature, issuer, audience, expiry
        and nonce are right."""
        try:
            header_part, claims_part, signature_part = token.split(".")
            header = json.loads(_b64decode(header_part))
            claims = json.loads(_b64decode(claims_part))
            signature = _b64decode(signature_part)
        except (ValueError, TypeError):
            raise IdentityError("The sign-in provider sent an ID token the engine can't read.") from None
        kty = self.ALGORITHMS.get(header.get("alg"))
        if kty is None:
            raise IdentityError(f"The sign-in provider signs with {header.get('alg')}, which the engine doesn't take (RS256 or ES256).")
        key = await self._key(header.get("kid"), kty)
        signed = f"{header_part}.{claims_part}".encode()
        try:
            if kty == "RSA":
                key.verify(signature, signed, padding.PKCS1v15(), hashes.SHA256())
            else:
                if len(signature) != 64:
                    raise InvalidSignature()
                r, s = int.from_bytes(signature[:32], "big"), int.from_bytes(signature[32:], "big")
                key.verify(encode_dss_signature(r, s), signed, ec.ECDSA(hashes.SHA256()))
        except InvalidSignature:
            raise IdentityError("The ID token's signature is wrong: this sign-in wasn't the provider's.") from None
        config = await self.config()
        audience = claims.get("aud")
        audiences = audience if isinstance(audience, list) else [audience]
        now = time.time()
        if claims.get("iss") != config["issuer"]:
            raise IdentityError("The ID token is from another issuer than the sign-in provider's.")
        if settings.OIDC_CLIENT_ID not in audiences or (len(audiences) > 1 and claims.get("azp") != settings.OIDC_CLIENT_ID):
            raise IdentityError("The ID token is for another application.")
        if not isinstance(claims.get("exp"), (int, float)) or claims["exp"] < now - 60:
            raise IdentityError("The ID token has expired. Try again.")
        if not hmac.compare_digest(str(claims.get("nonce", "")), nonce):
            raise IdentityError("The ID token belongs to another sign-in. Try again.")
        if not claims.get("sub"):
            raise IdentityError("The ID token doesn't say who signed in.")
        return claims

    def user(self, claims: dict) -> User:
        if settings.OIDC_EMAIL_CLAIM:
            name = settings.OIDC_EMAIL_CLAIM
        else:
            name = "email" if claims.get("email") else "preferred_username"
        if name == "email" and claims.get("email_verified") is False:
            raise IdentityError("The sign-in provider says this account's email address isn't verified.")
        groups = claims.get(settings.OIDC_GROUPS_CLAIM) or []
        # Only the groups ALLOWED_USERS names: the cookie stays small.
        wanted = named_groups()
        return User(
            id=f"{claims['iss']}|{claims['sub']}", email=str(claims.get(name) or ""),
            name=str(claims.get("name") or ""),
            groups=tuple(g for g in groups if isinstance(g, str) and g in wanted) if isinstance(groups, list) else (),
        )

    async def logout(self, request: Request) -> Response:
        """Forgets the session, then signs out at the provider when it has an
        end-session endpoint (otherwise it would sign straight back in)."""
        try:
            endpoint = (await self.config()).get("end_session_endpoint")
        except IdentityError:
            endpoint = None
        if isinstance(endpoint, str) and endpoint:
            response = RedirectResponse(f"{endpoint}{'&' if '?' in endpoint else '?'}{urlencode({'client_id': settings.OIDC_CLIENT_ID})}", 302)
        else:
            response = page("Signed out", "You're signed out of the engine.", link=sign_in_again("/"))
        response.delete_cookie(SESSION_COOKIE, path=cookie_path())
        return response


class Header(Identity):
    """A proxy in front signs users in and says who they are in headers. It
    must set them on every request, replacing any the browser sent, and the
    engine trusts them only with IDENTITY_SECRET or from
    IDENTITY_TRUSTED_PROXIES."""

    name = "header"

    def check(self) -> list[str]:
        problems = []
        if not settings.IDENTITY_SECRET and not settings.IDENTITY_TRUSTED_PROXIES:
            problems.append(
                "IDENTITY=header trusts headers only with IDENTITY_SECRET (which the proxy adds to every request) or "
                "from IDENTITY_TRUSTED_PROXIES (its addresses): set one, or both."
            )
        if settings.IDENTITY_SECRET and len(settings.IDENTITY_SECRET) < 32:
            problems.append("IDENTITY_SECRET must be at least 32 characters, and random.")
        for entry in settings.IDENTITY_TRUSTED_PROXIES:
            try:
                ipaddress.ip_network(entry, strict=False)
            except ValueError:
                problems.append(f"IDENTITY_TRUSTED_PROXIES has {entry!r}, which isn't an address or a network.")
        return problems

    def trusted(self, request: Request) -> bool:
        if settings.IDENTITY_SECRET:
            given = request.headers.get(settings.IDENTITY_SECRET_HEADER, "")
            if not hmac.compare_digest(given.encode(), settings.IDENTITY_SECRET.encode()):
                return False
        if settings.IDENTITY_TRUSTED_PROXIES:
            client = _address(request.client.host) if request.client else None
            networks = [ipaddress.ip_network(e, strict=False) for e in settings.IDENTITY_TRUSTED_PROXIES]
            if client is None or not any(client in network for network in networks):
                return False
        return True

    def authenticate(self, request: Request) -> User | None:
        if not self.trusted(request):
            return None
        headers = request.headers
        subject = headers.get(settings.IDENTITY_HEADER_USER, "").strip()
        email = headers.get(settings.IDENTITY_HEADER_EMAIL, "").strip()
        if not subject and not email:
            return None
        groups = tuple(g.strip() for g in headers.get(settings.IDENTITY_HEADER_GROUPS, "").split(",") if g.strip())
        return User(id=f"header|{subject or email}", email=email, name=headers.get(settings.IDENTITY_HEADER_NAME, "").strip(), groups=groups)

    async def login(self, request: Request, next: str) -> Response:
        user = self.authenticate(request)
        if user is None:
            return page(
                "Not signed in",
                "The proxy in front of the engine didn't say who you are, so the engine can't sign you in. Open the "
                "app through that proxy.", 401,
            )
        if not allowed(user):
            return page("Not allowed", f"{user.email or 'This account'} isn't allowed to use this engine.", 403)
        return RedirectResponse(next, 302)

    async def logout(self, request: Request) -> Response:
        if settings.IDENTITY_LOGOUT_URL:
            return RedirectResponse(settings.IDENTITY_LOGOUT_URL, 302)
        return page("Sign out at the proxy", "The proxy in front of the engine signs you in and out: sign out there.")


def configure(provider: Identity | None = None) -> Identity:
    """The app's own provider, or the one IDENTITY names (none by default in
    local development)."""
    if provider is not None:
        return provider
    name = settings.IDENTITY or ("none" if settings.IS_LOCAL else "")
    return {"none": NoIdentity, "oidc": OIDC, "header": Header}.get(name, Missing)()


def problems(provider: Identity) -> list[str]:
    """Why the engine can't start with `provider`, if it can't."""
    found = provider.check()
    if provider.name == "none" and not settings.IS_LOCAL:
        found.append("IDENTITY=none signs no one in, so it's for local development only (IS_LOCAL=true).")
    if provider.name not in ("none", "missing") and not settings.ALLOWED_USERS:
        found.append("Sign-in needs ALLOWED_USERS in the engine's .env: who may use it (`*@example.com`, an address, or `group:<id>`).")
    return found
