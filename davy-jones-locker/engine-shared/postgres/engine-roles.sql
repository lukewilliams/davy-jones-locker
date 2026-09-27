-- The engine's database and its two roles. Safe to run again, and to run
-- against another Postgres, as a superuser:
--
--   psql -h <host> -U postgres -v db=flow \
--        -v owner=engine -v owner_password=... \
--        -v reader=engine_reader -v reader_password=... \
--        -f engine-roles.sql
--
-- owner   owns the database. The engine connects as it (DATABASE_URL) for its
--         own tables, in schema flow, which it creates.
-- reader  what SQL nodes query through (QUERY_DATABASE_URL): it can connect
--         and read schema public, and nothing else: no writes, no temporary
--         tables, and not schema flow (saved graphs, stored files, runs).
--         The engine also attaches it read-only; this makes that true of the
--         database too.
--
-- Data for SQL nodes to query goes in schema public. Tables created there
-- later, by the owner or by whoever runs this script, are readable by the
-- reader automatically; for tables other roles create, GRANT SELECT yourself.

\set ON_ERROR_STOP on

SELECT format('CREATE ROLE %I', :'owner')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'owner') \gexec
ALTER ROLE :"owner" WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD :'owner_password';

SELECT format('CREATE ROLE %I', :'reader')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'reader') \gexec
ALTER ROLE :"reader" WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT PASSWORD :'reader_password';
ALTER ROLE :"reader" SET default_transaction_read_only = on;

SELECT format('CREATE DATABASE %I OWNER %I', :'db', :'owner')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'db') \gexec

-- Only these two connect (the owner keeps its rights as owner).
REVOKE ALL ON DATABASE :"db" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"db" TO :"reader";

\connect :"db"

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO :"reader";
GRANT SELECT ON ALL TABLES IN SCHEMA public TO :"reader";
ALTER DEFAULT PRIVILEGES FOR ROLE :"owner" IN SCHEMA public GRANT SELECT ON TABLES TO :"reader";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO :"reader";
