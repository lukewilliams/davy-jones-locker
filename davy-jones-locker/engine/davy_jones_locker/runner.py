"""The Python sandbox, the runner (see sandbox/). The engine never runs user
Python itself: it sends the code and its inputs (Parquet) to the runner,
which it reaches over a network the runner can reach nothing else on.

The runner's answer is form data: `result` (JSON: output, value, variables,
or error) and, when the script's last expression was a table, `table`
(Parquet).
"""

import json

import httpx

from . import formdata, settings


class RunnerUnavailable(RuntimeError):
    pass


def _timeout() -> httpx.Timeout:
    return httpx.Timeout(settings.RUN_TIMEOUT_SECONDS + 30, connect=5)


UNAVAILABLE = "The Python runner isn't available."


async def forward(body: bytes, content_type: str) -> tuple[bytes, str, int]:
    """POST /run/python as the browser sent it; the runner's answer as it is."""
    try:
        async with httpx.AsyncClient(timeout=_timeout()) as client:
            response = await client.post(
                f"{settings.RUNNER_URL}/run", content=body, headers={"content-type": content_type}
            )
    except httpx.HTTPError as e:
        raise RunnerUnavailable(UNAVAILABLE) from e
    return response.content, response.headers.get("content-type", "application/json"), response.status_code


def run(code: str, inputs: dict[str, bytes]) -> dict:
    """For graph runs on the server: the runner's result, plus `table`
    (Parquet bytes) when the script returned one."""
    parts = [("code", code.encode(), "text/x-python", None)]
    parts += [("input", data, "application/vnd.apache.parquet", name) for name, data in inputs.items()]
    body, content_type = formdata.encode(parts)
    try:
        response = httpx.post(
            f"{settings.RUNNER_URL}/run", content=body, headers={"content-type": content_type}, timeout=_timeout()
        )
    except httpx.HTTPError as e:
        raise RunnerUnavailable(UNAVAILABLE) from e
    if response.status_code != 200:
        try:
            return {"error": response.json().get("error", response.text)}
        except ValueError:
            return {"error": response.text}
    parts = {name: data for name, data, _, _ in formdata.decode(response.content, response.headers["content-type"])}
    result = json.loads(parts["result"])
    if "table" in parts:
        result["table"] = parts["table"]
    return result
