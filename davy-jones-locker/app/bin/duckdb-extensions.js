#!/usr/bin/env node
// Fetches the DuckDB extensions the app shell loads from the app's own origin
// (duckdbVersions.js: spatial), for the DuckDB-wasm it runs, into a folder the
// app serves as it is (Vite's public/, say):
//
//   davy-jones-locker-extensions public/duckdb-extensions
//
// It writes <folder>/<DuckDB version>/<platform>/<name>.duckdb_extension.wasm,
// as DuckDB asks for them, and a gzipped copy beside each (.wasm.gz) for a
// server that serves those (nginx's gzip_static). A file already there is kept.
// DuckDB checks each extension's signature when it loads it, so a copy that
// isn't DuckDB's own won't load.

import { mkdir, rename, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { DUCKDB_VERSION, SELF_HOSTED_EXTENSIONS, WASM_PLATFORMS } from '../duckdbVersions.js'

const SOURCE = 'https://extensions.duckdb.org'

const folder = process.argv[2]
if (!folder || process.argv.length > 3) {
  console.error('Usage: davy-jones-locker-extensions <folder the app serves, e.g. public/duckdb-extensions>')
  process.exit(2)
}

const exists = (path) => stat(path).then(() => true, () => false)

for (const platform of WASM_PLATFORMS) {
  for (const name of SELF_HOSTED_EXTENSIONS) {
    const file = `${DUCKDB_VERSION}/${platform}/${name}.duckdb_extension.wasm`
    const target = join(folder, file)
    if ((await exists(target)) && (await exists(`${target}.gz`))) continue
    const response = await fetch(`${SOURCE}/${file}`)
    if (!response.ok) {
      console.error(`Couldn't fetch ${SOURCE}/${file}: ${response.status} ${response.statusText}`)
      process.exit(1)
    }
    const bytes = new Uint8Array(await response.arrayBuffer())
    await mkdir(dirname(target), { recursive: true })
    // Written under a temporary name first, so an interrupted fetch leaves
    // nothing that looks complete.
    await writeFile(`${target}.gz.part`, gzipSync(bytes, { level: 9 }))
    await writeFile(`${target}.part`, bytes)
    await rename(`${target}.gz.part`, `${target}.gz`)
    await rename(`${target}.part`, target)
    console.log(`${file}: ${(bytes.length / 1048576).toFixed(1)} MB`)
  }
}
