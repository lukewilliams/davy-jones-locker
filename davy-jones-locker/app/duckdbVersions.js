// The DuckDB the browser runs, shared by duckdbSql.js and the command that
// fetches the extensions an app hosts itself (bin/duckdb-extensions.js).
// DuckDB-wasm's build pins the DuckDB inside it: keep DUCKDB_VERSION its
// version, and the engine's (requirements.in) the same, so the same SQL gives
// the same answers in both.

export const DUCKDB_WASM_VERSION = '1.33.1-dev64.0'
export const DUCKDB_VERSION = 'v1.5.5'

// Extensions loaded from the app's own origin rather than DuckDB's, so that
// nothing the editor does reaches DuckDB's servers: spatial (24 MB, loaded
// when geometry needs it), and those DuckDB-wasm loads by itself the first
// time a query needs them: parquet (Parquet files, and every table to and from
// the engine), json (JSON files, and the parse that decides where a query
// runs), icu (time zones: TIMESTAMPTZ, AT TIME ZONE; loaded at start, to set
// UTC) and excel (.xlsx).
// DuckDB checks each one's signature when it loads, wherever it came from.
export const SELF_HOSTED_EXTENSIONS = ['spatial', 'parquet', 'json', 'icu', 'excel']
// DuckDB-wasm's bundles (selectBundle picks one per browser).
export const WASM_PLATFORMS = ['wasm_eh', 'wasm_mvp']
// Where an app serves them, relative to its page, unless it says otherwise.
export const DEFAULT_EXTENSION_REPOSITORY = 'duckdb-extensions'
