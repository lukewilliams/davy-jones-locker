"""multipart/form-data both ways, for bodies mixing JSON and Parquet: the
browser sends inputs this way and reads results with Response.formData().

A part is (name, bytes, content type, filename or None).
"""

import re
import secrets

Part = tuple[str, bytes, str, str | None]


def encode(parts: list[Part]) -> tuple[bytes, str]:
    """A body and its Content-Type."""
    boundary = "flow-" + secrets.token_hex(16)
    chunks = []
    for name, data, content_type, filename in parts:
        disposition = f'form-data; name="{name}"' + (f'; filename="{filename}"' if filename else "")
        chunks.append(
            f"--{boundary}\r\nContent-Disposition: {disposition}\r\nContent-Type: {content_type}\r\n\r\n".encode()
        )
        chunks.append(data)
        chunks.append(b"\r\n")
    chunks.append(f"--{boundary}--\r\n".encode())
    return b"".join(chunks), f"multipart/form-data; boundary={boundary}"


def decode(body: bytes, content_type: str) -> list[Part]:
    """The parts of a body encode() made (or any simple form-data body)."""
    match = re.search(r'boundary="?([^";]+)"?', content_type)
    if not match:
        raise ValueError("Not a multipart body.")
    delimiter = b"--" + match.group(1).encode()
    parts: list[Part] = []
    for chunk in body.split(delimiter)[1:]:
        if chunk.startswith(b"--"):
            break
        head, _, data = chunk.removeprefix(b"\r\n").partition(b"\r\n\r\n")
        headers = head.decode("utf-8", "replace")
        name = re.search(r'name="([^"]*)"', headers)
        filename = re.search(r'filename="([^"]*)"', headers)
        kind = re.search(r"Content-Type:\s*([^\r\n]+)", headers, re.I)
        parts.append((
            name.group(1) if name else "",
            data.removesuffix(b"\r\n"),
            kind.group(1).strip() if kind else "application/octet-stream",
            filename.group(1) if filename else None,
        ))
    return parts
