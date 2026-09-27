# Security

DAVY JONES' LOCKER runs other people's SQL, Python and JavaScript, so its
safeguards matter. Thank you for helping keep them sound.

## Reporting a vulnerability

Please report it privately, not in a public issue:
[report a vulnerability](https://github.com/lukewilliams/davy-jones-locker/security/advisories/new)
(GitHub's private vulnerability reporting). Include what's affected, how to
reproduce it, and what an attacker could do with it.

This is a project maintained in spare time. You'll get a reply as soon as
possible, usually within a week, and a fix or a plan once the report is
understood. You'll be credited in the advisory unless you'd rather not be.

## Supported versions

Only the latest release of each package gets security fixes: `seamonster`
and `davy-jones-locker` on npm, and `davy-jones-locker` on PyPI. While they're
below 1.0, upgrade to the latest 0.x release to get a fix.

## What's in scope

The safeguards the project relies on, where a way around them is a
vulnerability:

- **The runner** (the Python sandbox): a script reaching the network, the
  engine's credentials or environment, another run's files, or anything that
  outlives its run; or getting past its time, memory or process limits.
- **SQL on the engine**: a query that writes, reads files, loads extensions,
  changes settings, connects anywhere other than the query database, or reads
  the engine's own tables through the read-only role.
- **JavaScript nodes**: code in the browser's sandboxed iframe reaching the
  page, its storage or its cookies; or any way to make the engine run
  JavaScript.
- **Secrets**: the AI assistant's key or database passwords reaching the
  browser, the runner, the logs, or the model.
- **Anything else** that lets a graph, a file or a response from the engine
  do more than the documentation says it can.

## Known limitations (not vulnerabilities)

These are documented, and reports of them alone aren't needed:

- **The engine has no sign-in yet.** Anyone who can reach it can use it,
  including its AI assistant's budget, and a Python script can reach it from
  the sandbox network. Don't expose the engine to the internet or untrusted
  networks until sign-in exists.
- **The doc widget doesn't sanitise markdown.** It renders HTML as given;
  sanitise documents that come from sources you don't control (see
  `seamonster/widgets/doc/README.md`).
- **Running the engine outside Docker** (for development) has no container
  around the runner; on macOS scripts have no memory limit, and on Windows
  no process limits at all.
- **The development passwords** in the `.env.example` files are examples:
  change them anywhere but your own machine.
