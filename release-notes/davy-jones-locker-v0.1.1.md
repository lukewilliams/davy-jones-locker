# davy-jones-locker 0.1.1 (engine)

A fix for the Python engine on PyPI. The npm browser shell is unchanged at
0.1.0, and works with this engine as before.

```
pip install --upgrade davy-jones-locker
```

## Fixed

- **Python nodes failed when the engine ran outside Docker on macOS.** The
  runner sets resource limits on each script, and macOS refuses the memory
  limit, so no script could start. Outside Linux, a limit the system refuses
  is now skipped. That's for development only: on macOS, scripts then have no
  memory limit.
- **In Docker nothing changes.** The runner's Linux container still applies
  every limit, and a run still fails rather than go without one.

No API changes.
