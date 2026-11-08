# davy-jones-locker 0.4.0

Sign-in: a deployed engine signs people in, through a provider you choose
(OpenID Connect, or a proxy's headers), and serves only those you name.
Each person's `b.` settings are their own, saved on the engine. Goes with
[seamonster 0.4.3](https://github.com/lukewilliams/davy-jones-locker/releases/tag/seamonster-v0.4.3).

```
pip install davy-jones-locker==0.4.0
npm install --save-exact davy-jones-locker@0.4.0 seamonster@0.4.3
```

Base images: `ghcr.io/lukewilliams/davy-jones-locker-engine:0.4.0` (and
`-runner`, `-node-worker`), also tagged `0.4`.

## Added

- **Sign-in** (`IDENTITY` in the engine's `.env`; the engine README,
  "Sign-in"):
  - `oidc`: authorisation code with PKCE, the engine a confidential client
    (`OIDC_DISCOVERY_URL`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`,
    `PUBLIC_URL`, `SECRET_KEY`). The ID token's signature (RS256 or ES256),
    issuer, audience, expiry and nonce are checked. The session is an
    encrypted, httpOnly cookie; no token reaches the page.
  - `header`: a proxy in front says who people are, believed only with its
    secret (`IDENTITY_SECRET`) or from its addresses
    (`IDENTITY_TRUSTED_PROXIES`).
  - `none`: local development only (`IS_LOCAL=true`), and its default there.
  - An app's own: a subclass of `Identity`, `create_app(identity=...)`.
- **`ALLOWED_USERS`**: who may use the engine, as email patterns
  (`*@example.com`) and groups (`group:<id>`), checked on every request.
- **`/auth/login`, `/auth/callback`, `/auth/logout`**, and `signIn` and
  `user` in `/health`.
- **Per-user `b.` settings**: signed in, a setting is yours, saved in the
  database (`user_settings`, encrypted with `SECRET_KEY`) and used for your
  requests only. `b.Settings.Reset` forgets only yours.
- **Jobs are their starter's**, and `runs` records who started each run
  (`user_id`).
- **The app shell** goes to the engine's sign-in when it says no one's
  signed in (or a request answers 401), and comes back; `status.signIn` and
  `status.user` on the engine client, and `signOut()`.
  `f.Security.WhoAmI` and `f.Security.SignOut` in the Terminal.
- **identity-mock** in engine-shared (the `identity` profile): an OIDC
  provider for your own machine that signs in whoever you say.

## Changed

- **Every endpoint but `/health` and `/auth/*` needs a signed-in user**
  whom `ALLOWED_USERS` names (401, or 403). Without `IS_LOCAL=true` the
  engine now starts once sign-in is set up, instead of refusing outright.
- **Requests that change things need `X-Requested-By`** (any value), in
  local development too: the app shell sends it, and a page on another site
  can't, so it can't act for anyone. Anything else calling the engine's
  POST, PUT or DELETE endpoints (a script, n8n) must add it.
- **`/health` without a user** answers only `{ status, signIn, user: null }`.
- **`POST /commands`** no longer needs `IS_LOCAL`: signed in, it changes
  your own settings.
- **With sign-in, the app shell keeps no `b.` settings in localStorage**,
  and forgets any kept from before.
- The engine depends on `cryptography` (50.0.2 in the images).

## Upgrading

- Move the app shell and the engine to 0.4.0 together: an older shell
  doesn't send `X-Requested-By`, so a 0.4.0 engine refuses its queries and
  runs.
- Rebuild the app's engine image (an app on the framework's images:
  `docker compose build`).
- Local development needs nothing new: with `IS_LOCAL=true` and no
  `IDENTITY`, the engine signs no one in, as before.
- To deploy: set `IDENTITY` and its settings, `ALLOWED_USERS` and
  `SECRET_KEY` in the engine's `.env` (the `.env.example` has them).

## Known limits

- A session can't be ended early from the engine: signing out ends it in
  that browser, but a copied cookie works until `SESSION_HOURS` pass (8), or
  `SECRET_KEY` changes, which signs everyone out.
- Only the groups `ALLOWED_USERS` names are kept in an OIDC session.
- Machines (n8n calling `/graphs/{id}/execute`) can't sign in yet: with
  sign-in on, they're refused.
- Saved settings are read once per user per engine process: replicas don't
  see each other's changes until they restart.
- Jobs are kept in the engine's memory: an engine restarted while one runs
  loses it.
- PythonScript inside a loop runs one at a time whatever Runs at once
  says: the runner runs one script at a time.
