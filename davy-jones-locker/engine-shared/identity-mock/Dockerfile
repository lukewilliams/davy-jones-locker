# identity-mock: an OpenID Connect provider for local development (server.py).
FROM python:3.12-slim

RUN pip install --no-cache-dir fastapi==0.141.1 uvicorn==0.53.0 cryptography==50.0.2
WORKDIR /app
COPY server.py .
RUN useradd --uid 10001 --no-create-home mock
USER mock
EXPOSE 3000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "3000"]
