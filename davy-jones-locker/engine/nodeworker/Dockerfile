# The node worker: runs the app's own node kinds (davy_jones_locker/nodeworker/).
# Built from davy-jones-locker/engine/. An app builds its own on this one
# (FROM), adding its nodes.py, its handlers and their libraries, and sets
# NODE_KINDS (nodes:KINDS, say); the app's compose.yaml runs it read-only,
# unprivileged, with no credentials and no network out.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /srv

COPY nodeworker/requirements.txt ./nodeworker-requirements.txt
RUN pip install --no-cache-dir --require-hashes -r nodeworker-requirements.txt

# Only what the worker needs of the engine's package: none of its libraries.
COPY davy_jones_locker/__init__.py davy_jones_locker/formdata.py davy_jones_locker/nodes.py ./davy_jones_locker/
COPY davy_jones_locker/nodeworker ./davy_jones_locker/nodeworker

USER 65534:65534
EXPOSE 3000
CMD ["uvicorn", "davy_jones_locker.nodeworker.server:app", "--host", "0.0.0.0", "--port", "3000"]
