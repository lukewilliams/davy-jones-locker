// Small pieces of DuckDB SQL shared by the runner (graphRunner.js) and the
// built-in node kinds (builtinKinds.js).

export const quote = (name) => `"${name.replaceAll('"', '""')}"`
export const literal = (text) => `'${text.replaceAll("'", "''")}'`

// Bytes from DuckDB's hex() text. (The SQL engine hands bytes over as plain
// arrays, so a query that needs them as bytes selects them as hex.)
export const fromHex = (hex) => Uint8Array.from(hex.match(/../g) ?? [], (b) => parseInt(b, 16))

// COPY a query's rows to a new file, which the engine holds for readFile.
// (DuckDB-wasm logs "Buffering missing file" for it: harmless, and
// registering the file first would stop it being written.) Resolves to the
// number of rows written.
export async function copyTo(sql, select, path, options) {
  const copied = await sql.query(`COPY (${select}) TO ${literal(path)} (${options})`)
  return Number(copied.rows[0]?.[0] ?? 0)
}

export async function loadExcel(sql) {
  await sql.query('INSTALL excel')
  await sql.query('LOAD excel')
}
