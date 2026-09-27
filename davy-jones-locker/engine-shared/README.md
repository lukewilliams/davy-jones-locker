# engine-shared

The services engines share, on the `shared` Docker network, which this project
creates and owns: DAVY JONES' LOCKER's optional development services. Use it
until there are real ones (another Postgres, a real identity provider, ...),
then point the engine's settings at those instead.

| Service | What | On this machine |
|---|---|---|
| `postgres` | Postgres 18: the engine's database | `127.0.0.1:5432` (`POSTGRES_PORT`) |

Coming here: easyauth-mock (identity), azurite (blob storage), perhaps n8n.

## Running it

```
cp davy-jones-locker/engine-shared/.env.example davy-jones-locker/engine-shared/.env
docker compose -f davy-jones-locker/engine-shared/compose.yaml up -d --wait
```

It's a compose project of its own, so stopping an app's services leaves it
(and its data) running. To stop it:
`docker compose -f davy-jones-locker/engine-shared/compose.yaml down` (add
`-v` to delete its data too).

## Postgres

On first start (an empty volume), [postgres/engine-roles.sql](postgres/engine-roles.sql)
creates the engine's database and two roles, named and passworded in `.env`
(name them for your app: `engine_myapp`, `engine_myapp_reader`):

| Role (`.env`) | For | Can |
|---|---|---|
| `ENGINE_USER` (`engine`) | the engine itself (`DATABASE_URL`) | own database `ENGINE_DB` (`flow`), and create the engine's tables in schema `flow` |
| `ENGINE_READER` (`engine_reader`) | SQL nodes (`QUERY_DATABASE_URL`) | connect, and read schema `public`. No writes, no temporary tables, not schema `flow` |

Data for SQL nodes goes in the database's `public` schema. Tables created
there by the owner or the superuser are readable by the reader automatically;
anyone else's need `GRANT SELECT ... TO <reader>`.

The passwords take effect only when the database is first created. To change
them later, use `ALTER ROLE`, or start over with `down -v`. The script can be
run again, and against another Postgres: its header has the `psql` command.

The engine reaches it as `postgres:5432` on the shared network; its
`.env.example` already has both roles' URLs with these development passwords.

## Notes

- The scripts are built into the image rather than mounted, so this works
  wherever the Docker engine runs (in WSL, say, driven from Windows).
- `SHARED_NETWORK` in `.env` renames the network; set the same where the
  app's compose file runs, for the engines.
