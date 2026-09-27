# Contributing

Thanks for helping. Issues and pull requests are welcome at
[github.com/lukewilliams/davy-jones-locker](https://github.com/lukewilliams/davy-jones-locker).
For anything bigger than a fix, open an issue first so we can agree on the
approach before you spend time on it.

## Setting up

You need Node 20.19 or later, Python 3.12, and Docker with Compose and Buildx.

```
cd seamonster && npm install && npm run build && cd ..
cd davy-jones-locker/app && npm install && npm run build && cd ../..
```

The engine, outside Docker (from `davy-jones-locker/engine/`):

```
python3.12 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt -r runner/requirements.txt && pip install -e .
uvicorn davy_jones_locker.sandbox.server:app --port 9002
RUNNER_URL=http://127.0.0.1:9002 uvicorn davy_jones_locker.main:app --port 9001
```

Here the runner has no container around it (and on Windows it can't apply
its process limits either): this is for development only. `docker compose -f
davy-jones-locker/compose.yaml up --build` runs both as they're meant to run.

## Before you open a pull request

- **Build what you changed**: `npm run build` in `seamonster/`, then
  `davy-jones-locker/app/`. Each package's `dist/` is committed, so commit the
  rebuilt `dist/` with the source that changed it.
- **Try it in a browser.** There's no test suite yet: check the flow you
  changed by hand (adding and wiring nodes, running them, the panels and
  right-click menus), and say in the pull request what you checked.
- **Update the docs in the same change**: the README of whatever you touched.
- **Keep the layers apart.** SEAMONSTER imports nothing from the framework and
  knows no server, storage or commands of its own: what an app supplies
  arrives as props or registrations. Neither names a particular app.

## Rules that aren't negotiable

These protect whoever runs the engine:

- JavaScript nodes run only in the browser, in a sandbox. The engine refuses
  them, and must, until there are real safeguards for running user code there.
- Nothing with credentials reaches the runner (the Python sandbox):
  `runner.env` holds limits only.
- Secrets live in the engine's `.env`, never in the browser.
- Python libraries for scripts are added to `engine/runner/requirements.in`,
  recompiled with hashes (the command is in the file), and built into the
  image. Scripts can't install anything at run time.
- SQL on the engine stays one read-only SELECT on a locked-down DuckDB (see
  the engine README's Safeguards). Changes there need a clear explanation of
  why they're safe.

## Style

- Plain CSS with tokens (no Tailwind); themes are classes and tokens on the
  window.
- Comments and docs in plain, specific English, saying what and why.
  Messages to users say what happened and what to do.
- Unavailable buttons use `aria-disabled`, never `disabled`, which drops
  keyboard focus and with it the editor's hotkeys.

## Licence

By contributing, you agree that your contributions are licensed under the
[Apache License 2.0](LICENSE), as the Apache licence's section 5 describes.
