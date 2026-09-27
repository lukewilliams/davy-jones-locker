# The runner: the Python sandbox. Built from davy-jones-locker/engine/; the
# app's compose.yaml runs it read-only, unprivileged, with no network out.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /srv

# The server and the libraries scripts can import: nothing else is installable.
COPY runner/requirements.txt .
RUN pip install --no-cache-dir --require-hashes -r requirements.txt

# Only what the sandbox needs of the engine's package: none of its libraries.
COPY davy_jones_locker/__init__.py davy_jones_locker/formdata.py ./davy_jones_locker/
COPY davy_jones_locker/sandbox ./davy_jones_locker/sandbox

USER 65534:65534
EXPOSE 3000
CMD ["uvicorn", "davy_jones_locker.sandbox.server:app", "--host", "0.0.0.0", "--port", "3000"]
