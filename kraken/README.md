# KRAKEN

The example app: DAVY JONES' LOCKER (the framework) on SEAMONSTER (the UI
library), set up the way an app of your own would be. It's also where
changes to the framework are tried before they're released, since it builds
from this repo's own `seamonster/` and `davy-jones-locker/` (`file:` links).
An app of your own uses the published packages and images instead (see
"Your own app" below).

| Folder | What |
|---|---|
| [app/](app/) | the browser app: [App.vue](app/App.vue) (title, theme, engine, storage name, and the panels: the editor's, plus the Map panel), [themes/](app/themes/) (ABYSS, an app's own theme), its [Dockerfile](app/Dockerfile) and [nginx.conf](app/nginx.conf) |
| [engine/](engine/) | engine-kraken: [main.py](engine/main.py) (the framework's `create_app`), its [Dockerfile](engine/Dockerfile) on the framework's image, and its settings |
| [compose.yaml](compose.yaml) | the app, the engine and its Python sandbox |

## Running it

From the repo root. First build the library and the shell, which the app
links to (`dist/` is committed, so this is only needed after changing
them):

```
cd seamonster && npm install && npm run build && cd ..
cd davy-jones-locker/app && npm install && npm run build && cd ../..
```

**In Docker** (the app on http://localhost:8130, the engine on 9130):

```
cp kraken/.env.example kraken/.env                                 # compose's IS_LOCAL
cp kraken/engine/.env.example kraken/engine/.env                   # the engine's settings
cp kraken/engine/runner.env.example kraken/engine/runner.env       # the runner's limits
docker compose -f davy-jones-locker/engine-shared/compose.yaml up -d --wait   # Postgres and the shared network
docker compose -f kraken/compose.yaml up -d --build
```

Without Postgres, `docker network create shared` is enough. The engine
then runs without its database: saved graphs and runs answer 503, and
everything else works.

**The frontend alone**, with Vite (on 5130), against the engine in Docker:

```
cd kraken/app && npm install && npm run dev
```

After rebuilding `seamonster` or the shell, restart Vite with `--force`:
it pre-bundles them.

## What's KRAKEN's

- **The app:** title KRAKEN, and its own theme, ABYSS (FLOWDARK with a
  deep-water gradient, from `defineTheme`). Its storage name is `kraken`.
  Its panels are the editor's (`EditorPanels`) and the Map panel (P), which
  draws the selected node's geometry.
- **The engine:** `engine-kraken`, built `FROM` the framework's image
  (compose builds that first, as `davy-jones-locker-engine`), and
  `engine-kraken-runner`, the framework's runner as it is, on the
  `kraken-sandbox` network. Postgres roles `engine_kraken` and
  `engine_kraken_reader`: set them in engine-shared's `.env` (`ENGINE_USER`,
  `ENGINE_READER`) to match `kraken/engine/.env`.
- **Sign-in:** off in local development, unless `IDENTITY` is set.
  `engine/.env.example` has the settings for any OpenID Connect provider,
  and for engine-shared's identity-mock, to try it on your own machine.

## Your own app

Start from this folder, and change what makes it yours: the title, the
theme, the engine's name, the storage name, the ports. Then:

- **In `app/package.json`:** the published packages, pinned exactly, in
  place of the `file:` links. That's `seamonster` and `davy-jones-locker`
  at the versions of a release.
- **In `app/Dockerfile`:** only the app stage. The packages come from npm,
  so the stage that builds them goes.
- **In `engine/Dockerfile`:**
  `FROM ghcr.io/lukewilliams/davy-jones-locker-engine:<version>`.
- **In `compose.yaml`:** the runner as `image:
  ghcr.io/lukewilliams/davy-jones-locker-runner:<version>`. The service that
  builds `davy-jones-locker-engine` goes.

The engine README says how to add node kinds, `b.` commands and Python
libraries.
