// .xlsx files are zips. Two things DuckDB doesn't do for them: list a
// workbook's sheets (it reads a sheet by name), and write one that opens (in
// DuckDB-wasm, its xlsx writer leaves a stray byte in front of the zip).

const LOCAL_HEADER = 0x04034b50
const CENTRAL_HEADER = 0x02014b50
const END_OF_DIRECTORY = 0x06054b50
const NOT_XLSX = "This doesn't look like an .xlsx file."

const viewOf = (bytes) => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

// Where the zip's end-of-central-directory record is, or -1 (zip64 isn't
// handled: workbooks that big aren't either).
function findEnd(bytes, view) {
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === END_OF_DIRECTORY) return i
  }
  return -1
}

// The sheet names of a workbook, in order, from xl/workbook.xml.
export async function xlsxSheetNames(bytes) {
  const xml = await readZipEntry(bytes, 'xl/workbook.xml')
  return [...xml.matchAll(/<sheet\b[^>]*?\bname="([^"]*)"/g)].map((m) => unescapeXml(m[1]))
}

const unescapeXml = (s) =>
  s.replace(/&(lt|gt|quot|apos|amp);/g, (_, e) => ({ lt: '<', gt: '>', quot: '"', apos: "'", amp: '&' })[e])

// A workbook as written, fixed if bytes were written ahead of the zip: its
// directory records where things are from the zip's own start, so what comes
// before that start is found from where the directory really is, and cut.
// A workbook that's already right comes back as it was.
export function repairXlsx(bytes) {
  const view = viewOf(bytes)
  if (bytes.length >= 4 && view.getUint32(0, true) === LOCAL_HEADER) return bytes
  const end = findEnd(bytes, view)
  if (end < 0) return bytes
  const directorySize = view.getUint32(end + 12, true)
  const recordedStart = view.getUint32(end + 16, true)
  const extra = end - directorySize - recordedStart
  const fixable = extra > 0 && view.getUint32(extra, true) === LOCAL_HEADER
  return fixable ? bytes.slice(extra) : bytes
}

// One file out of a zip, as text, found through its central directory.
async function readZipEntry(bytes, path) {
  const view = viewOf(bytes)
  const end = findEnd(bytes, view)
  if (end < 0) throw new Error(NOT_XLSX)

  const entries = view.getUint16(end + 10, true)
  let p = view.getUint32(end + 16, true)
  for (let n = 0; n < entries && view.getUint32(p, true) === CENTRAL_HEADER; n++) {
    const method = view.getUint16(p + 10, true)
    const size = view.getUint32(p + 20, true)
    const nameLength = view.getUint16(p + 28, true)
    const skip = nameLength + view.getUint16(p + 30, true) + view.getUint16(p + 32, true)
    const name = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nameLength))
    if (name === path) {
      const local = view.getUint32(p + 42, true)
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true)
      const data = bytes.subarray(start, start + size)
      if (method === 0) return new TextDecoder().decode(data)
      if (method === 8) {
        const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
        return new Response(stream).text()
      }
      throw new Error(NOT_XLSX)
    }
    p += 46 + skip
  }
  throw new Error(NOT_XLSX)
}
