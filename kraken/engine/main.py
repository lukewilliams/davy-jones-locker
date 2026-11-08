"""engine-kraken: DAVY JONES' LOCKER's engine as KRAKEN, the example app, runs
it. An app's own node kinds, their categories, b. commands and sign-in
provider go to create_app here (`nodes=`, `categories=`, `commands=`,
`identity=`): see the engine README."""

from davy_jones_locker import create_app

app = create_app(title="engine-kraken")
