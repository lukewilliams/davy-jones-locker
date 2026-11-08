# davy-jones-locker 0.1.2 (app shell)

The browser shell on npm, now working with
[seamonster 0.2.0](https://github.com/lukewilliams/davy-jones-locker/releases/tag/seamonster-v0.2.0)
as well as 0.1. The Python engine on PyPI is unchanged at 0.1.1, and works
with this shell as before.

```
npm install davy-jones-locker@0.1.2 seamonster@0.2.0
```

## Changed

- **seamonster 0.2 is accepted:** the shell's peer dependency is now
  `^0.1.0 || ^0.2.0`. Below 1.0, npm's `^0.1.0` doesn't reach 0.2.0, so
  0.1.0 would refuse it. Nothing else changed: `<DavyJonesLocker />` renders
  SEAMONSTER's `FlowgraphEditor` as before, and its props still pass through
  (`auto-hide-rails`, new in seamonster 0.2.0, included).

Upgrading to seamonster 0.2.0 renames the editor's Console panel to Terminal
(hotkey T); see its release notes.

No API changes. Its version is 0.1.2 rather than 0.1.1 because the engine's
0.1.1 release already has that tag: the two halves share one sequence of
numbers.
