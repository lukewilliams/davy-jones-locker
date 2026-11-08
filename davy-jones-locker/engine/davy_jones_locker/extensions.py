"""Installs the DuckDB extensions the engine loads (postgres and spatial), once,
before it runs: the engine locks DuckDB down and can't install anything then.

    python -m davy_jones_locker.extensions

The image runs this at build, and so does anyone running the engine outside
Docker. DuckDB's own `INSTALL postgres` fetches over plain HTTP and ignores
proxies, so on a network that allows only HTTPS through a proxy it fails.
This fetches the same files over HTTPS with urllib, which follows
`HTTPS_PROXY` and trusts `SSL_CERT_FILE`, then installs each from the file.
DuckDB still checks each extension's signature, so a copy that isn't DuckDB's
own won't install.
"""

import gzip
import sys
import tempfile
import urllib.request
from pathlib import Path

import duckdb

SOURCE = "https://extensions.duckdb.org"
# What the engine says (LOAD postgres, LOAD spatial), then the file's name on
# the server: postgres is an alias of postgres_scanner.
EXTENSIONS = {"postgres": "postgres_scanner", "spatial": "spatial"}


def install(names=EXTENSIONS) -> None:
    con = duckdb.connect()
    installed = {
        row[0]
        for row in con.execute(
            "SELECT extension_name FROM duckdb_extensions() WHERE installed"
        ).fetchall()
    }
    version = con.execute("SELECT version()").fetchone()[0]  # v1.5.5
    platform = con.execute("PRAGMA platform").fetchone()[0]  # linux_amd64
    with tempfile.TemporaryDirectory() as scratch:
        for name in names:
            file = EXTENSIONS[name]
            if name in installed or file in installed:
                continue
            url = f"{SOURCE}/{version}/{platform}/{file}.duckdb_extension.gz"
            try:
                # The server refuses urllib's own User-Agent (403).
                request = urllib.request.Request(url, headers={"User-Agent": "davy-jones-locker"})
                with urllib.request.urlopen(request, timeout=120) as response:
                    data = gzip.decompress(response.read())
            except OSError as e:
                sys.exit(f"Couldn't fetch {url}: {e}")
            path = Path(scratch) / f"{file}.duckdb_extension"
            path.write_bytes(data)
            con.execute("INSTALL '" + str(path).replace("'", "''") + "'")
            print(f"{name}: installed ({len(data) / 1048576:.1f} MB)")


if __name__ == "__main__":
    install()
