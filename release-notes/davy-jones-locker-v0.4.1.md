# davy-jones-locker 0.4.1

A security patch, for the shell and the engine together. Moving from 0.4.0
is recommended for every app: its two fixes close holes in 0.4.0 that
anyone allowed into an engine, or any web page its user visits, could use.
Goes with
[seamonster 0.4.3](https://github.com/lukewilliams/davy-jones-locker/releases/tag/seamonster-v0.4.3),
which is unchanged.

```
pip install davy-jones-locker==0.4.1
npm install --save-exact davy-jones-locker@0.4.1 seamonster@0.4.3
```

Base images: `ghcr.io/lukewilliams/davy-jones-locker-engine:0.4.1` (and
`-runner`, `-node-worker`), also tagged `0.4`.

## Fixed

- **SQL could read the query database's password.** The engine attached
  the query database (`QUERY_DATABASE_URL`) with its credentials in the
  `ATTACH` string, which DuckDB shows to any query (`duckdb_databases()`,
  the `allowed_paths` setting). So anyone allowed to run SQL on a deployed
  engine could read the reader role's password. The credentials now go in
  a temporary DuckDB secret, which shows its password only as redacted, and
  `duckdb_secrets()` and `which_secret()` are refused too. **If your query
  database's reader role was on a deployed 0.4.0 engine, change its
  password.**
- **An engine that signs no one in answered any host name.** With
  `IDENTITY=none` (local development), a web page could point a name of its
  own at `127.0.0.1` (DNS rebinding) and then call the engine as its own
  origin, running SQL and Python as you. Such an engine now answers only
  `localhost` (and `*.localhost`), `127.0.0.1`, `::1`, `PUBLIC_HOST`, and the
  names in `LOCAL_ALLOWED_HOSTS`, and refuses any other (403). Signed-in
  engines don't check: their cookies are bound to their own name.
- **`preferred_username` could stand in for the email.** With no
  `OIDC_EMAIL_CLAIM`, an OIDC sign-in without an `email` matched
  `ALLOWED_USERS` against `preferred_username`, which some providers let
  users choose. The engine now reads `email` alone unless
  `OIDC_EMAIL_CLAIM` names another claim.
- **The sample compose files published the engine (and KRAKEN's app) on
  every address.** They now publish on `127.0.0.1` only:
  `${ENGINE_BIND:-127.0.0.1}` in the framework's `compose.yaml`,
  `${APP_BIND:-127.0.0.1}` in KRAKEN's.

## Changed

- **DuckDB's extensions are installed over HTTPS:** `python -m
  davy_jones_locker.extensions`, which the engine image runs at build, in
  place of DuckDB's own `INSTALL`, which fetches over plain HTTP and
  ignores proxies. It follows `HTTPS_PROXY`, and DuckDB still checks each
  extension's signature. The shell's `davy-jones-locker-extensions` follows
  `HTTPS_PROXY` too (Node 22.21 or later).
- **The minor image tag** (`0.4`) moves only to the highest version
  released in that minor.

## Upgrading

- Move the app shell and the engine to 0.4.1 together, and rebuild the
  app's engine image (`docker compose build`, on the 0.4.1 base images).
- **An engine that signs no one in, reached under another name** (a name
  in `/etc/hosts`, a machine's name on your network, a dev container's):
  add that name to `LOCAL_ALLOWED_HOSTS` in the engine's `.env`
  (comma-separated). `localhost`, `127.0.0.1` and the engine's own
  `PUBLIC_HOST` need nothing. A proxy in front (an app's nginx) that passes
  the browser's `Host` on, as KRAKEN's does, needs nothing either while the
  browser uses `localhost`.
- **OIDC providers that send no `email`** (some company directories send
  the address as `preferred_username`, or `upn`): set `OIDC_EMAIL_CLAIM`
  to that claim. Only do it where the provider, not the user, sets it.
- **Each app's compose file:** publish its ports on `127.0.0.1` only, as
  KRAKEN's now does (`"127.0.0.1:8130:80"`, or a variable like `APP_BIND`
  to change it once sign-in is on). An engine with `IS_LOCAL=true` signs
  no one in, so anyone who could reach its port could run Python and SQL.
- If your query database's reader role was used by a deployed 0.4.0
  engine, change its password.

## Known limits

- A session can't be ended early from the engine: signing out ends it in
  that browser, but a copied cookie works until `SESSION_HOURS` pass (8), or
  `SECRET_KEY` changes, which signs everyone out. Its groups are a snapshot
  from sign-in.
- Only the groups `ALLOWED_USERS` names are kept in an OIDC session.
- Machines (n8n calling `/graphs/{id}/execute`) can't sign in yet: with
  sign-in on, they're refused.
- Saved settings are read once per user per engine process: replicas don't
  see each other's changes until they restart.
- Jobs are kept in the engine's memory: an engine restarted while one runs
  loses it.
- PythonScript inside a loop runs one at a time whatever Runs at once
  says: the runner runs one script at a time.
