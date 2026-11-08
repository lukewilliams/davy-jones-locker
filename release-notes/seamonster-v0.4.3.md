# seamonster 0.4.3

Who's signed in, for a server that signs people in.

```
npm install seamonster@0.4.3
```

## Added

- **`status.signIn` and `status.user`** on the `server` prop (both
  optional): the server's sign-in provider, and who's signed in
  (`{ email, name }`). The status bar puts their email after the server's
  address, and the app's log says who connected.

## Changed

- **The local development warning** in the app's log says the server
  "signs no one in" only when `status.signIn` names no provider.

## Known limits

- Opened after a run, a loop shows its last run's nodes, or none when the
  server ran it: `status` says how each run went.
- No resume: running a loop again runs every row again.
- In the browser a loop runs one run at a time.
