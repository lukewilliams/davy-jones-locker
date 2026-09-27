# Postgres, with the engine's database and roles set up on first start.
# The scripts are copied in rather than mounted, so this works whichever
# machine the Docker engine runs on (a mount would need the path there).
FROM postgres:18

COPY engine-roles.sql /opt/engine-shared/
COPY init-engine.sh /docker-entrypoint-initdb.d/
RUN sed -i 's/\r$//' /opt/engine-shared/engine-roles.sql /docker-entrypoint-initdb.d/init-engine.sh
