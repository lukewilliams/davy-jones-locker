# app-kraken: KRAKEN's frontend, built and served by nginx. The context is the
# repo root (kraken/compose.yaml sets it), because the app links to seamonster
# and davy-jones-locker/app (file: links), which are built here first.
#   docker build -f kraken/app/Dockerfile .

ARG NODE_VERSION=22

# ---- seamonster and the framework's app shell
FROM node:${NODE_VERSION}-slim AS libraries
WORKDIR /repo
# Manifests first, so installs are cached until a package.json or lock changes.
COPY seamonster/package.json seamonster/package-lock.json seamonster/
RUN npm ci --prefix seamonster --no-audit --no-fund
# .npmrc too: it tells npm not to install the seamonster peer dependency.
COPY davy-jones-locker/app/package.json davy-jones-locker/app/package-lock.json davy-jones-locker/app/.npmrc davy-jones-locker/app/
RUN npm ci --prefix davy-jones-locker/app --no-audit --no-fund
COPY seamonster/ seamonster/
RUN npm run build --prefix seamonster
COPY davy-jones-locker/app/ davy-jones-locker/app/
RUN npm run build --prefix davy-jones-locker/app

# ---- the app
FROM libraries AS app
COPY kraken/app/package.json kraken/app/package-lock.json kraken/app/
RUN npm ci --prefix kraken/app --no-audit --no-fund
COPY kraken/app/ kraken/app/
RUN npm run build --prefix kraken/app

# ---- serve it
FROM nginx:1.27-alpine
COPY kraken/app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=app /repo/kraken/app/dist /usr/share/nginx/html
