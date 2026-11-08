# engine-kraken: DAVY JONES' LOCKER's engine image with KRAKEN's entry point.
# kraken/compose.yaml builds the framework's image first and hands it in as
# davy-jones-locker-engine. An app outside this repo starts from the published
# image instead: FROM ghcr.io/lukewilliams/davy-jones-locker-engine:<version>
FROM davy-jones-locker-engine

COPY main.py ./

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]
