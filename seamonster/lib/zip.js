// Zip files, for shapefiles. Reading (DataIngest): DuckDB-wasm's GDAL can't
// open a zip registered with it (/vsizip/), so the members are registered one
// by one. Read from the central directory (a member's local header can leave
// its sizes to a trailing descriptor); stored and deflated members only,
// which is what zip tools write. No Zip64 (members over 4 GB). Writing
// (DataExport): deflated members, with UTF-8 names.

const EOCD = 0x06054b50 // end of central directory
const CENTRAL = 0x02014b50
const LOCAL = 0x04034b50

// [{ name, bytes }] for every file in the zip (not its folders).
export async function unzip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const end = findEnd(view)
  const count = view.getUint16(end + 10, true)
  let at = view.getUint32(end + 16, true)
  if (at === 0xffffffff || count === 0xffff) throw new Error("This zip is a Zip64 file, which can't be read here.")
  const files = []
  for (let i = 0; i < count; i++) {
    if (view.getUint32(at, true) !== CENTRAL) throw new Error('This zip file is damaged.')
    const flags = view.getUint16(at + 8, true)
    const method = view.getUint16(at + 10, true)
    const size = view.getUint32(at + 20, true)
    const nameLength = view.getUint16(at + 28, true)
    const extraLength = view.getUint16(at + 30, true)
    const commentLength = view.getUint16(at + 32, true)
    const local = view.getUint32(at + 42, true)
    const name = new TextDecoder(flags & 0x800 ? 'utf-8' : 'latin1').decode(bytes.subarray(at + 46, at + 46 + nameLength))
    at += 46 + nameLength + extraLength + commentLength
    if (name.endsWith('/')) continue
    if (flags & 1) throw new Error(`${name} in this zip is encrypted, so it can't be read.`)
    if (view.getUint32(local, true) !== LOCAL) throw new Error('This zip file is damaged.')
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true)
    const data = bytes.subarray(start, start + size)
    if (method === 0) files.push({ name, bytes: data.slice() })
    else if (method === 8) files.push({ name, bytes: await inflate(data) })
    else throw new Error(`${name} in this zip is compressed in a way that can't be read here (method ${method}).`)
  }
  return files
}

// The end-of-central-directory record: the last thing in the file, before a
// comment of up to 64 KB.
function findEnd(view) {
  for (let at = view.byteLength - 22; at >= Math.max(0, view.byteLength - 22 - 65535); at--) {
    if (view.getUint32(at, true) === EOCD) return at
  }
  throw new Error("This isn't a zip file.")
}

async function inflate(data) {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

// A zip of [{ name, bytes }].
export async function zip(files) {
  const encoder = new TextEncoder()
  const locals = []
  const centrals = []
  let offset = 0
  for (const file of files) {
    const name = encoder.encode(file.name)
    const crc = crc32(file.bytes)
    const data = await deflate(file.bytes)
    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, LOCAL, true)
    writeEntry(local, 4, { crc, size: data.length, rawSize: file.bytes.length, nameLength: name.length })
    const central = new DataView(new ArrayBuffer(46))
    central.setUint32(0, CENTRAL, true)
    central.setUint16(4, 20, true) // made by: version 2.0
    writeEntry(central, 6, { crc, size: data.length, rawSize: file.bytes.length, nameLength: name.length })
    central.setUint32(42, offset, true)
    locals.push(new Uint8Array(local.buffer), name, data)
    centrals.push(new Uint8Array(central.buffer), name)
    offset += 30 + name.length + data.length
  }
  const directorySize = centrals.reduce((sum, part) => sum + part.length, 0)
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, EOCD, true)
  end.setUint16(8, files.length, true)
  end.setUint16(10, files.length, true)
  end.setUint32(12, directorySize, true)
  end.setUint32(16, offset, true)
  return concat([...locals, ...centrals, new Uint8Array(end.buffer)])
}

// The fields a local header and a central directory entry share, from
// "version needed" on.
function writeEntry(view, at, { crc, size, rawSize, nameLength }) {
  view.setUint16(at, 20, true) // version needed: 2.0
  view.setUint16(at + 2, 0x800, true) // the name is UTF-8
  view.setUint16(at + 4, 8, true) // deflated
  view.setUint16(at + 6, 0, true) // time: 00:00
  view.setUint16(at + 8, (1980 - 1980) << 9 | 1 << 5 | 1, true) // date: 1 January 1980
  view.setUint32(at + 10, crc, true)
  view.setUint32(at + 14, size, true)
  view.setUint32(at + 18, rawSize, true)
  view.setUint16(at + 22, nameLength, true)
}

async function deflate(data) {
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export function concat(parts) {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let at = 0
  for (const part of parts) {
    out.set(part, at)
    at += part.length
  }
  return out
}

let crcTable = null

function crc32(bytes) {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      crcTable[n] = c >>> 0
    }
  }
  let crc = 0xffffffff
  for (const b of bytes) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
