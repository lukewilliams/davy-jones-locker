#!/bin/sh
# Runs once, when the database is first created (Postgres's entrypoint runs
# the scripts in /docker-entrypoint-initdb.d then, and never again).
set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v db="${ENGINE_DB:-flow}" \
  -v owner="${ENGINE_USER:-engine}" \
  -v owner_password="$ENGINE_PASSWORD" \
  -v reader="${ENGINE_READER:-engine_reader}" \
  -v reader_password="$ENGINE_READER_PASSWORD" \
  -f /opt/engine-shared/engine-roles.sql
