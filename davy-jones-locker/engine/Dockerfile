# DAVY JONES' LOCKER's engine image: the API, listening on 3000. Built from
# davy-jones-locker/engine/. An app's engine image is built on this one (FROM),
# adding its entry point; run as it is, it's the engine with nothing added.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /srv

COPY requirements.txt .
RUN pip install --no-cache-dir --require-hashes -r requirements.txt

RUN useradd --system --uid 10001 --create-home --home-dir /home/engine engine
USER engine
# DuckDB's postgres extension, fetched now: at run time DuckDB is locked down
# and can't install anything.
RUN python -c "import duckdb; duckdb.sql('INSTALL postgres')"

COPY davy_jones_locker ./davy_jones_locker
# The packages Python scripts can import, which the AI assistant tells the model.
COPY runner/requirements.in ./runner/requirements.in

EXPOSE 3000
CMD ["uvicorn", "davy_jones_locker.main:app", "--host", "0.0.0.0", "--port", "3000"]
